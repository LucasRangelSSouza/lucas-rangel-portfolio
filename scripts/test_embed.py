#!/usr/bin/env python3
"""Generate one embedding through EMBED_BASE_URL and check its dimension and latency.

This is the connection point for the day the GPU (Qwen3-Embedding) is back: run it before switching
EMBED_PROVIDER from `none` to `openai_compat` (see docs/RUNBOOK_EMBEDDINGS.md).

Environment (same names the API reads):
  EMBED_BASE_URL   required, e.g. http://<gpu-host>:<port>/v1
  EMBED_API_KEY    optional bearer token
  EMBED_MODEL      default qwen-embedding
  EMBED_DIM        default 768 (the stored vectors are Qwen3-Embedding truncated to 768)
Optional: EMBED_TEXT (query to embed), EMBED_MAX_LATENCY_S (default 10; slower than this is a failure).

Exit codes: 0 ok, 1 wrong dimension / too slow, 2 endpoint error or not configured.
"""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "apps" / "api"))

from rag_chat_backend.embed import EmbeddingError, OpenAICompatEmbedder  # noqa: E402


def main() -> int:
    if not os.environ.get("EMBED_BASE_URL"):
        print("EMBED_BASE_URL is not set (e.g. http://<gpu-host>:<port>/v1)", file=sys.stderr)
        return 2
    text = os.environ.get("EMBED_TEXT", "merenda escolar para a rede municipal")
    max_latency = float(os.environ.get("EMBED_MAX_LATENCY_S", "10"))
    embedder = OpenAICompatEmbedder(attempts=1)
    started = time.monotonic()
    try:
        vector = embedder.embed(text, "query")
    except EmbeddingError as exc:
        # bad_dimension is a wrong EMBED_DIM / wrong model; everything else is the endpoint
        print(f"FAIL {exc.code}: {exc}", file=sys.stderr)
        return 1 if exc.code == "bad_dimension" else 2
    elapsed = time.monotonic() - started
    print(f"model={embedder.model} dims={len(vector)} expected={embedder.dim} latency={elapsed:.2f}s")
    if len(vector) != embedder.dim:
        print(f"FAIL: expected {embedder.dim} dimensions", file=sys.stderr)
        return 1
    if elapsed > max_latency:
        print(f"FAIL: latency above {max_latency}s", file=sys.stderr)
        return 1
    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
