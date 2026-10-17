"""In-process query embeddings.

EMBED_PROVIDER selects how a query becomes a vector:
  none           (default) no embeddings; search runs lexical only.
  openai_compat  any OpenAI-compatible /v1/embeddings endpoint serving Qwen3-Embedding. Aliases: qwen.
                 EMBED_BASE_URL, EMBED_API_KEY, EMBED_MODEL (qwen-embedding), EMBED_DIM (768, Matryoshka truncation),
                 EMBED_EXTRA_HEADERS (JSON, optional), EMBED_QUERY_INSTRUCT (task text placed in the query prefix),
                 EMBED_TIMEOUT_S (8) and EMBED_ATTEMPTS (2) bound how long a search can wait on a dead endpoint.

Query vectors and the stored document vectors must come from the same model: the vectors table was built with
Qwen3-Embedding at 768 dimensions, so another model cannot be used without re-indexing (see docs/RUNBOOK_EMBEDDINGS.md).
"""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request

MAX_TEXT = 1000
DEFAULT_INSTRUCT = "Given a question about Brazilian public procurement, retrieve the procurement notices that answer it"


class EmbeddingError(Exception):
    """Raised with a stable code so callers can tell an unreachable endpoint from a bad answer."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}: {detail}" if detail else code)
        self.code = code


class OpenAICompatEmbedder:
    """OpenAI-compatible embeddings endpoint serving Qwen3-Embedding (instruction on the query side only)."""

    provider = "openai_compat"

    def __init__(self, base_url: str | None = None, api_key: str | None = None, model: str | None = None,
                 dim: int | None = None, extra_headers: dict | None = None, instruct: str | None = None,
                 timeout: float | None = None, attempts: int | None = None, backoff: float = 1.0) -> None:
        self.base_url = (base_url or os.environ["EMBED_BASE_URL"]).rstrip("/")
        self.api_key = api_key if api_key is not None else os.environ.get("EMBED_API_KEY", "")
        self.model = model or os.environ.get("EMBED_MODEL", "qwen-embedding")
        self.dim = int(dim or os.environ.get("EMBED_DIM", "768"))
        self.extra_headers = extra_headers if extra_headers is not None else json.loads(os.environ.get("EMBED_EXTRA_HEADERS") or "{}")
        self.instruct = instruct or os.environ.get("EMBED_QUERY_INSTRUCT", DEFAULT_INSTRUCT)
        self.timeout = timeout if timeout is not None else float(os.environ.get("EMBED_TIMEOUT_S", "8"))
        self.attempts = attempts if attempts is not None else int(os.environ.get("EMBED_ATTEMPTS", "2"))
        self.backoff = backoff

    def format(self, text: str, kind: str) -> str:
        text = text[:MAX_TEXT]
        return f"Instruct: {self.instruct}\nQuery:{text}" if kind == "query" else text

    def embed(self, text: str, kind: str = "query") -> list[float]:
        body = json.dumps({"model": self.model, "input": [self.format(text, kind)], "dimensions": self.dim}).encode()
        headers = {"Content-Type": "application/json", **self.extra_headers}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        last: EmbeddingError | None = None
        for attempt in range(self.attempts):
            try:
                request = urllib.request.Request(self.base_url + "/embeddings", data=body, headers=headers)
                with urllib.request.urlopen(request, timeout=self.timeout) as response:
                    vector = json.load(response)["data"][0]["embedding"]
                if len(vector) != self.dim:
                    raise EmbeddingError("bad_dimension", f"expected {self.dim}, got {len(vector)}")
                return vector
            except urllib.error.HTTPError as exc:
                last = EmbeddingError("endpoint_error", f"HTTP {exc.code}")
                if exc.code < 500 and exc.code != 429:
                    break  # a client error will not fix itself on retry
            except (urllib.error.URLError, TimeoutError, ConnectionError) as exc:
                last = EmbeddingError("endpoint_unreachable", str(exc)[:120])
            except (KeyError, IndexError, ValueError, TypeError) as exc:
                raise EmbeddingError("bad_response", str(exc)[:80]) from exc
            if attempt + 1 < self.attempts:
                time.sleep(self.backoff * (attempt + 1))
        raise last or EmbeddingError("endpoint_unreachable")


# Kept so older imports and notes keep working.
QwenEmbedder = OpenAICompatEmbedder


def make_embedder(provider: str | None = None):
    """Return the embedder named by EMBED_PROVIDER, or None when embeddings are off (lexical search only)."""
    name = (provider if provider is not None else os.environ.get("EMBED_PROVIDER", "none")).strip().lower()
    if name in ("", "none", "off"):
        return None
    if name in ("openai_compat", "qwen"):
        return OpenAICompatEmbedder()
    if name == "vertex":
        raise ValueError("EMBED_PROVIDER=vertex was removed (it depended on GCP); use none or openai_compat")
    raise ValueError(f"unknown EMBED_PROVIDER {name!r} (none or openai_compat)")
