"""Abuse guard for the endpoints that spend model capacity (port of the former lib/guard.ts).

It is a cost limiter, not an access control: anyone may ask as many questions as a person reasonably would, and
nobody can turn the page into a free API. State is in memory (one replica); a restart resets the counters.
"""
from __future__ import annotations

import os
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Callable

from fastapi import Request


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


@dataclass(frozen=True)
class GuardConfig:
    daily_per_ip: int
    daily_global: int
    concurrent_per_ip: int
    concurrent_global: int


@dataclass
class Admission:
    ok: bool
    message: str = ""
    retry_after: int = 0
    release: Callable[[], None] = lambda: None


def _int_env(name: str, fallback: int) -> int:
    try:
        value = float(os.environ.get(name, ""))
    except ValueError:
        return fallback
    return int(value) if value > 0 else fallback


def answer_limits() -> GuardConfig:
    return GuardConfig(_int_env("GUARD_ANSWER_DAILY_PER_IP", 300), _int_env("GUARD_ANSWER_DAILY_GLOBAL", 4000),
                       _int_env("GUARD_ANSWER_CONCURRENT_PER_IP", 2), _int_env("GUARD_ANSWER_CONCURRENT_GLOBAL", 6))


def explore_limits() -> GuardConfig:
    return GuardConfig(_int_env("GUARD_EXPLORE_DAILY_PER_IP", 1000), _int_env("GUARD_EXPLORE_DAILY_GLOBAL", 20000),
                       _int_env("GUARD_EXPLORE_CONCURRENT_PER_IP", 4), _int_env("GUARD_EXPLORE_CONCURRENT_GLOBAL", 12))


def client_ip(request: Request) -> str:
    """Behind Traefik the peer address is appended to X-Forwarded-For, so the last entry is the one the proxy saw."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if parts:
            return parts[-1][:64]
    real = request.headers.get("x-real-ip")
    if real:
        return real[:64]
    return (request.client.host if request.client else "unknown")[:64]


def cross_site_origin(request: Request) -> bool:
    """Same-site browsers send Origin on POST; a cross-site page is turned away. Absent Origin (curl) passes."""
    origin = request.headers.get("origin")
    if not origin:
        return False
    from urllib.parse import urlparse

    try:
        return urlparse(origin).netloc != request.headers.get("host")
    except ValueError:
        return True


class Guard:
    """One instance per route family (answer, explore) would share the in-flight counters; both share this class."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._per_ip_day: dict[str, tuple[str, int]] = {}
        self._in_flight_by_ip: dict[str, int] = {}
        self._global_day = (_today(), 0)
        self._global_in_flight = 0

    def admit(self, ip: str, config: GuardConfig) -> Admission:
        with self._lock:
            day = _today()
            if self._global_day[0] != day:
                self._global_day = (day, 0)
            bucket = self._per_ip_day.get(ip)
            mine = bucket[1] if bucket and bucket[0] == day else 0
            if mine >= config.daily_per_ip:
                return Admission(False, "This address reached today's question limit. It resets at midnight UTC.", 3600)
            if self._global_day[1] >= config.daily_global:
                return Admission(False, "The demo reached its daily capacity. It resets at midnight UTC.", 3600)
            if self._in_flight_by_ip.get(ip, 0) >= config.concurrent_per_ip:
                return Admission(False, "Wait for your running question to finish before sending another.", 10)
            if self._global_in_flight >= config.concurrent_global:
                return Admission(False, "Many people are asking at once. Try again in a few seconds.", 10)
            self._per_ip_day[ip] = (day, mine + 1)
            self._global_day = (day, self._global_day[1] + 1)
            self._in_flight_by_ip[ip] = self._in_flight_by_ip.get(ip, 0) + 1
            self._global_in_flight += 1
            if len(self._per_ip_day) > 5000:
                self._per_ip_day = {k: v for k, v in self._per_ip_day.items() if v[0] == day}
                if len(self._per_ip_day) > 5000:
                    self._per_ip_day.clear()
        released = False

        def release() -> None:
            nonlocal released
            with self._lock:
                if released:
                    return
                released = True
                left = self._in_flight_by_ip.get(ip, 1) - 1
                if left <= 0:
                    self._in_flight_by_ip.pop(ip, None)
                else:
                    self._in_flight_by_ip[ip] = left
                self._global_in_flight = max(0, self._global_in_flight - 1)

        return Admission(True, release=release)
