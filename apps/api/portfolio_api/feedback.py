"""Comments, likes and dislikes for the articles on the portfolio (lucas.<root domain>/articles/<slug>/).

No accounts: a comment needs a name and a text; a vote needs a random voter id the browser keeps in localStorage.
Abuse controls: articles must exist, length limits, a honeypot field, a per-IP rate limit on writes (IPs are only
kept as salted hashes, in memory), one vote per voter per article, and an admin token to delete.

Routes (same origin as the site, under /api/feedback):
  GET    /api/feedback/{slug}                 counts and comments, newest first
  POST   /api/feedback/{slug}/vote            {"voter": "<uuid>", "value": 1 | -1 | 0}
  POST   /api/feedback/{slug}/comments        {"name": "...", "body": "...", "website": ""}
  DELETE /api/feedback/comments/{id}          header X-Admin-Token
  GET    /api/feedback/health

Environment: FEEDBACK_DB (SQLite path, default /data/feedback.db), FEEDBACK_ADMIN_TOKEN,
FEEDBACK_ARTICLES_FILE (JSON list of articles with a "slug"; default: the articles.json baked into the image),
FEEDBACK_SITE_ROOT (optional legacy check: <root>/articles/<slug>/index.html must exist).
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import secrets
import sqlite3
import threading
import time
from collections import defaultdict, deque
from contextlib import closing
from pathlib import Path

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, Field

from .guard import client_ip

SALT = secrets.token_hex(16)  # rotates on restart; hashes are only used for rate limiting
SLUG = re.compile(r"^[a-z0-9][a-z0-9-]{2,90}$")
VOTER = re.compile(r"^[a-f0-9-]{16,64}$")
LIMITS = {"comment": (6, 600), "vote": (40, 600)}  # writes per IP per window (seconds)

router = APIRouter(prefix="/api/feedback")
_writes: dict[str, deque] = defaultdict(deque)
_writes_lock = threading.Lock()
_ready: set[str] = set()
_ready_lock = threading.Lock()
_slugs_cache: dict[str, tuple[float, frozenset[str]]] = {}

SCHEMA = """
    pragma journal_mode = wal;
    create table if not exists comments (
        id integer primary key autoincrement, slug text not null, name text not null, body text not null,
        created_at integer not null);
    create index if not exists comments_slug on comments (slug, created_at);
    create table if not exists votes (
        slug text not null, voter text not null, value integer not null, updated_at integer not null,
        primary key (slug, voter));
"""


def db_path() -> str:
    return os.environ.get("FEEDBACK_DB", "/data/feedback.db")


def db() -> sqlite3.Connection:
    path = db_path()
    con = sqlite3.connect(path, timeout=5)
    con.row_factory = sqlite3.Row
    with _ready_lock:
        if path not in _ready:
            con.executescript(SCHEMA)
            _ready.add(path)
    return con


def db_status() -> str:
    """'ok' when the SQLite file can be opened and written, else 'unavailable' (never raises)."""
    try:
        with closing(db()) as con:
            con.execute("select 1 from comments limit 1").fetchall()
        return "ok"
    except Exception:
        return "unavailable"


def _articles_file() -> Path | None:
    candidates = [os.environ.get("FEEDBACK_ARTICLES_FILE"), "/app/articles.json",
                  str(Path(__file__).resolve().parents[2] / "site" / "content" / "articles.json")]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return Path(candidate)
    return None


def known_slugs() -> frozenset[str]:
    path = _articles_file()
    if path is None:
        return frozenset()
    mtime = path.stat().st_mtime
    cached = _slugs_cache.get(str(path))
    if cached and cached[0] == mtime:
        return cached[1]
    data = json.loads(path.read_text(encoding="utf-8"))
    slugs = frozenset(a["slug"] for a in data if isinstance(a, dict) and isinstance(a.get("slug"), str))
    _slugs_cache[str(path)] = (mtime, slugs)
    return slugs


def require_article(slug: str) -> None:
    if not SLUG.match(slug):
        raise HTTPException(404, "unknown article")
    root = os.environ.get("FEEDBACK_SITE_ROOT")
    if root:
        ok = os.path.isfile(os.path.join(root, "articles", slug, "index.html"))
    else:
        ok = slug in known_slugs()
    if not ok:
        raise HTTPException(404, "unknown article")


def rate_limit(request: Request, kind: str) -> None:
    key = kind + hashlib.sha256((SALT + client_ip(request)).encode()).hexdigest()
    now, (limit, window) = time.time(), LIMITS[kind]
    with _writes_lock:
        q = _writes[key]
        while q and q[0] < now - window:
            q.popleft()
        if len(q) >= limit:
            raise HTTPException(429, "too many requests, try again in a few minutes")
        q.append(now)


def summary(con: sqlite3.Connection, slug: str, voter: str | None = None) -> dict:
    likes, dislikes = con.execute(
        "select coalesce(sum(value = 1), 0), coalesce(sum(value = -1), 0) from votes where slug = ?", (slug,)).fetchone()
    comments = [dict(r) for r in con.execute(
        "select id, name, body, created_at from comments where slug = ? order by created_at desc limit 200", (slug,))]
    mine = 0
    if voter and VOTER.match(voter):
        row = con.execute("select value from votes where slug = ? and voter = ?", (slug, voter)).fetchone()
        mine = row["value"] if row else 0
    return {"likes": likes, "dislikes": dislikes, "my_vote": mine, "comments": comments}


@router.get("/health")
def health() -> dict:
    status = db_status()
    return {"status": "ok" if status == "ok" else "degraded", "db": status}


@router.get("/{slug}")
def read(slug: str, voter: str | None = None) -> dict:
    require_article(slug)
    with closing(db()) as con:
        return summary(con, slug, voter)


class Vote(BaseModel):
    voter: str = Field(min_length=16, max_length=64)
    value: int = Field(ge=-1, le=1)


@router.post("/{slug}/vote")
def vote(slug: str, payload: Vote, request: Request) -> dict:
    require_article(slug)
    if not VOTER.match(payload.voter):
        raise HTTPException(422, "invalid voter id")
    rate_limit(request, "vote")
    with closing(db()) as con, con:
        if payload.value == 0:
            con.execute("delete from votes where slug = ? and voter = ?", (slug, payload.voter))
        else:
            con.execute(
                "insert into votes (slug, voter, value, updated_at) values (?, ?, ?, ?) "
                "on conflict (slug, voter) do update set value = excluded.value, updated_at = excluded.updated_at",
                (slug, payload.voter, payload.value, int(time.time())))
        return summary(con, slug, payload.voter)


class Comment(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    body: str = Field(min_length=2, max_length=2000)
    website: str = ""  # honeypot: hidden in the form, bots fill it


@router.post("/{slug}/comments", status_code=201)
def comment(slug: str, payload: Comment, request: Request) -> dict:
    require_article(slug)
    if payload.website:
        return {"ok": True}  # pretend success to the bot
    name, body = " ".join(payload.name.split()), payload.body.strip()
    if not name or len(body) < 2:
        raise HTTPException(422, "name and comment are required")
    if len(re.findall(r"https?://", body)) > 2:
        raise HTTPException(422, "too many links")
    rate_limit(request, "comment")
    with closing(db()) as con, con:
        con.execute("insert into comments (slug, name, body, created_at) values (?, ?, ?, ?)",
                    (slug, name, body, int(time.time())))
        return summary(con, slug)


@router.delete("/comments/{comment_id}")
def delete(comment_id: int, x_admin_token: str = Header(default="")) -> dict:
    token = os.environ.get("FEEDBACK_ADMIN_TOKEN", "")
    if not token or not secrets.compare_digest(x_admin_token.encode(), token.encode()):
        raise HTTPException(403, "forbidden")
    with closing(db()) as con, con:
        n = con.execute("delete from comments where id = ?", (comment_id,)).rowcount
    return {"deleted": n}
