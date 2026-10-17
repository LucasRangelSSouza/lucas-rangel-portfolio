"""RAG routes (/api/answer, /api/explore, /api/health), ported from the former Next route handlers.

The contract is unchanged: same paths, same limits, same error messages. The research engine is the
`rag_chat_backend` package used as a library, built lazily from the environment so the process starts (and reports
`degraded`/`pending`) even when Postgres or the model are not reachable yet.
"""
from __future__ import annotations

import asyncio
import json
import os
import re
import threading
import time
from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from .guard import Guard, answer_limits, client_ip, cross_site_origin, explore_limits

MAX_QUESTION_CHARS = 1000
MAX_BODY_BYTES = 24 * 1024
ANSWER_TIMEOUT_S = 100
EXPLORE_TIMEOUT_S = 25
MODES = {"text", "vector", "hybrid"}
SLUG_RE = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
SHA_RE = re.compile(r"^[a-f0-9]{64}$", re.I)
CORPUS_ID_RE = re.compile(r"^[a-z0-9_-]{1,40}$")

router = APIRouter()
guard = Guard()


class EngineHolder:
    """Builds the research engine once, from the environment; remembers why it could not."""

    def __init__(self, factory=None) -> None:
        self._factory = factory
        self._lock = threading.Lock()
        self.engine: Any = None
        self.error: str | None = None
        self._tried = False
        self._health: tuple[float, dict] | None = None
        self._refreshing = False

    def configured(self) -> bool:
        return self._factory is not None or bool(os.environ.get("RAG_DATABASE_URL") or os.environ.get("RAG_INDEX_PATH"))

    def get(self):
        with self._lock:
            if self.engine is None and not self._tried and self.configured():
                self._tried = True
                try:
                    factory = self._factory
                    if factory is None:
                        from rag_chat_backend.server import make_engine as factory
                    self.engine = factory()
                except Exception as exc:  # bad config must not stop the process; health reports it
                    self.error = type(exc).__name__
            return self.engine

    def health(self, ttl: float = 20.0, first_wait: float = 2.5) -> dict:
        """Engine health, cached: a down database must not make every probe wait for its connect timeout."""
        engine = self.get()
        if engine is None:
            if self.error:
                return {"status": "unavailable", "corpora": [], "config_error": self.error}
            return {"status": "pending", "corpora": []}
        if self._health and time.monotonic() - self._health[0] < ttl:
            return self._health[1]
        box: dict = {}

        def compute() -> None:
            try:
                box["value"] = engine.health()
            except Exception:
                box["value"] = {"status": "degraded", "db_unavailable": True, "corpora": []}
            self._health = (time.monotonic(), box["value"])
            self._refreshing = False

        if self._health is not None:  # stale: answer now, refresh in the background
            if not self._refreshing:
                self._refreshing = True
                threading.Thread(target=compute, daemon=True).start()
            return self._health[1]
        thread = threading.Thread(target=compute, daemon=True)
        thread.start()
        thread.join(first_wait)
        return box.get("value") or {"status": "degraded", "db_unavailable": True, "corpora": []}


def holder(request: Request) -> EngineHolder:
    return request.app.state.rag


def _err(status: int, message: str, headers: dict | None = None) -> JSONResponse:
    return JSONResponse({"error": message}, status_code=status, headers=headers)


def _clip(value: Any, n: int) -> str | None:
    return value[:n] if isinstance(value, str) else None


def safe_query(value: Any) -> dict | None:
    if not isinstance(value, dict):
        return None
    sql, columns, rows = value.get("sql"), value.get("columns"), value.get("rows")
    if not isinstance(sql, str) or not isinstance(columns, list) or not isinstance(rows, list):
        return None

    def cell(c: Any) -> Any:
        if c is None or isinstance(c, (bool, int, float)):
            return c
        return c[:200] if isinstance(c, str) else None

    out = {"sql": sql[:4000], "columns": [c[:60] for c in columns if isinstance(c, str)][:30],
           "rows": [[cell(c) for c in row[:30]] if isinstance(row, list) else [] for row in rows[:25]]}
    if isinstance(value.get("explanation"), str):
        out["explanation"] = value["explanation"][:300]
    return out


def safe_citation(value: Any) -> dict | None:
    if not isinstance(value, dict) or not isinstance(value.get("title"), str) or not isinstance(value.get("source_uri"), str):
        return None
    out: dict = {"title": value["title"][:240], "source_uri": value["source_uri"][:1024]}
    for key, limit in (("chunk_id", 160), ("document_id", 160), ("license_note", 500)):
        if isinstance(value.get(key), str):
            out[key] = value[key][:limit]
    dataset = value.get("dataset") if isinstance(value.get("dataset"), dict) else {}
    slug = dataset.get("slug") if isinstance(dataset.get("slug"), str) and SLUG_RE.match(dataset["slug"]) else None
    version = dataset.get("version")
    if slug and isinstance(version, int) and not isinstance(version, bool) and version > 0:
        ds: dict = {"slug": slug[:128], "version": version}
        sha = dataset.get("manifest_sha256")
        if isinstance(sha, str) and SHA_RE.match(sha):
            ds["manifest_sha256"] = sha.lower()
        out["dataset"] = ds
    if isinstance(value.get("record_ids"), list):
        out["record_ids"] = [i[:160] for i in value["record_ids"] if isinstance(i, str)][:8]
    query = safe_query(value.get("query"))
    if query:
        out["query"] = query
    score = value.get("score")
    if isinstance(score, (int, float)) and not isinstance(score, bool) and score == score and abs(score) != float("inf"):
        out["score"] = score
    return out


def safe_answer(value: Any, search_mode: str) -> dict | None:
    if not isinstance(value, dict) or value.get("status") not in ("answered", "abstained", "refused"):
        return None
    if not isinstance(value.get("answer"), str) or not isinstance(value.get("citations"), list):
        return None
    citations = [c for c in (safe_citation(c) for c in value["citations"]) if c][:8]
    reason = value.get("safety_reason")
    out = {"status": value["status"], "answer": value["answer"][:12_000], "citations": citations,
           "safety_reason": reason[:80] if isinstance(reason, str) else None}
    if isinstance(value.get("grounded"), bool):
        out["grounded"] = value["grounded"]
    out["search_mode"] = search_mode
    return out


@router.post("/api/answer")
async def answer(request: Request):
    if cross_site_origin(request):
        return _err(403, "Ask from the chat page.")
    try:
        declared = int(request.headers.get("content-length") or 0)
    except ValueError:
        declared = 0
    if declared > MAX_BODY_BYTES:
        return _err(413, "The request is too large.")
    try:
        raw = await request.body()
    except Exception:
        return _err(400, "Send a valid JSON question.")
    if len(raw) > MAX_BODY_BYTES:
        return _err(413, "The request is too large.")
    try:
        body = json.loads(raw)
    except ValueError:
        return _err(400, "Send a valid JSON question.")
    if not isinstance(body, dict):
        return _err(400, "Send a valid JSON question.")
    if any(k not in ("question", "corpora", "history") for k in body):
        return _err(400, "Only the question, corpora and history fields are accepted.")
    history = body.get("history", [])
    if not isinstance(history, list) or len(history) > 4 or any(not isinstance(h, str) or len(h) > MAX_QUESTION_CHARS for h in history):
        return _err(400, "Send at most four earlier questions.")
    corpora = body.get("corpora", [])
    if not isinstance(corpora, list) or len(corpora) > 5 or any(not isinstance(c, str) or not CORPUS_ID_RE.match(c) for c in corpora):
        return _err(400, "Choose up to five research bases.")
    question = body.get("question")
    if not isinstance(question, str) or not question.strip() or len(question) > MAX_QUESTION_CHARS:
        return _err(400, "Enter a question of up to 1,000 characters.")
    engine = holder(request).get()
    if engine is None:
        return _err(503, "The research service is not ready yet.")
    admission = guard.admit(client_ip(request), answer_limits())
    if not admission.ok:
        return _err(429, admission.message, {"retry-after": str(admission.retry_after)})
    try:
        result = await asyncio.wait_for(run_in_threadpool(engine.answer, question, corpora, history), ANSWER_TIMEOUT_S)
        safe = safe_answer(result, engine.search_mode())
        if safe is None:
            return _err(502, "The research service returned an invalid response.")
        return JSONResponse(safe, headers={"cache-control": "no-store"})
    except Exception:
        return _err(503, "The research service is unavailable. Try again shortly.")
    finally:
        admission.release()


def _explore_row(r: dict) -> dict:
    link = r.get("link")
    try:
        rank = float(r.get("rank") or 0)
    except (TypeError, ValueError):
        rank = 0.0
    return {"id": str(r.get("id") or "")[:80], "org": _clip(r.get("org"), 200), "municipality": _clip(r.get("municipality"), 80),
            "uf": _clip(r.get("uf"), 2), "modality": _clip(r.get("modality"), 80), "published": str(r.get("published") or "")[:10],
            "text": str(r.get("text") or "")[:400],
            "link": link[:300] if isinstance(link, str) and link.startswith("https://pncp.gov.br/") else None,
            "rank": int(rank) if rank == int(rank) else rank}


@router.get("/api/explore")
async def explore(request: Request, mode: str = "hybrid", q: str = "", limit: str = "12"):
    engine = holder(request).get()
    if engine is None:
        return _err(503, "Search is not available.")
    q = q.strip()
    try:
        lim = max(1, min(20, int(float(limit)) or 12))
    except (ValueError, OverflowError):
        lim = 12
    if mode not in MODES or not 3 <= len(q) <= 200:
        return _err(400, "Type between 3 and 200 characters.")
    admission = guard.admit(client_ip(request), explore_limits())
    if not admission.ok:
        return _err(429, admission.message, {"retry-after": str(admission.retry_after)})
    try:
        store = next((c.store for c in engine.corpora.values() if hasattr(c.store, "explore")), None)
        if store is None:
            raise LookupError("no searchable base")
        payload = await asyncio.wait_for(run_in_threadpool(store.explore, mode, q, lim), EXPLORE_TIMEOUT_S)
        results = [_explore_row(r) for r in (payload.get("results") or [])[:lim]]
        try:
            total = int(payload.get("total"))
        except (TypeError, ValueError):
            total = len(results)
        vector = bool(payload.get("vector_available"))
        return JSONResponse({"mode": mode, "total": total, "results": results, "vector_available": vector,
                             "search_mode": "hybrid" if vector else "lexical"})
    except Exception:
        return _err(503, "The search service is unavailable.")
    finally:
        admission.release()


def embed_provider_name() -> str:
    name = os.environ.get("EMBED_PROVIDER", "none").strip().lower()
    if name in ("", "none", "off"):
        return "none"
    return "openai_compat" if name in ("openai_compat", "qwen") else "invalid"


def corpus_health(raw: dict) -> dict:
    """Map the engine report to the CorpusHealth contract the UI reads, plus the search mode and degraded flags."""
    status = raw.get("status")
    out: dict = {"status": status if status in ("ready", "degraded", "pending", "unavailable") else "pending",
                 "corpus_name": raw["corpus_name"] if isinstance(raw.get("corpus_name"), str) else "PNCP"}
    for key in ("release_version", "data_cutoff"):
        if isinstance(raw.get(key), str):
            out[key] = raw[key]
    for key in ("table_count", "record_count"):
        if isinstance(raw.get(key), int) and not isinstance(raw.get(key), bool):
            out[key] = raw[key]
    corpora = []
    for c in (raw.get("corpora") or [])[:8]:
        if not isinstance(c, dict):
            continue
        item = {"id": str(c.get("id"))[:40], "label": str(c.get("label"))[:80]}
        if isinstance(c.get("release_version"), str):
            item["release_version"] = c["release_version"]
        if isinstance(c.get("data_cutoff"), str):
            item["data_cutoff"] = c["data_cutoff"]
        if isinstance(c.get("record_count"), int):
            item["record_count"] = c["record_count"]
        corpora.append(item)
    if corpora:
        out["corpora"] = corpora
    out["model_status"] = raw.get("model_status") if raw.get("model_status") in ("ready", "extractive", "unavailable") else "unavailable"
    out["search_mode"] = raw["search_mode"] if raw.get("search_mode") in ("lexical", "hybrid") else "lexical"
    out["embed_provider"] = embed_provider_name()
    if raw.get("db_unavailable"):
        out["db_unavailable"] = True
    if raw.get("config_error"):
        out["config_error"] = raw["config_error"]
    return out
