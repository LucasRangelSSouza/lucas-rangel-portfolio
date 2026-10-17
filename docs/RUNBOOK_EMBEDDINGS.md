# Runbook: re-enable Qwen embeddings (vector search)

State today: `EMBED_PROVIDER=none`. The GPU that serves Qwen3-Embedding is off, so `portfolio-api` runs lexical
(full-text) search only. `/api/health` reports `"search_mode": "lexical"` and the UI shows a "Lexical search" tag.
Nothing is broken in this mode; vector ranking is simply absent.

The vectors already stored in Postgres (`pncp.editais_embeddings`) are Qwen3-Embedding truncated to 768 dimensions.
A query vector from any other model is meaningless against them, so the only way back is the same model, again at 768
dimensions. Another provider would need a full re-index first.

## The 5 steps

1. **Turn the GPU instance on** and wait until its OpenAI-compatible server answers `GET <base>/models`.
   (See the `qwen` skill / Vast runbook for the instance and its cost; remember to turn it off afterwards.)
2. **Point the API at it.** In the `portfolio-api` env file on the VPS set:
   `EMBED_BASE_URL=http://<gpu-host>:<port>/v1` (a direct IP URL does not need the `qwen.` DNS record, which was removed),
   `EMBED_API_KEY=<key, if the endpoint wants one>`, `EMBED_MODEL=qwen-embedding`, `EMBED_DIM=768`.
   Leave `EMBED_PROVIDER=none` for now. If you want a domain instead, recreate the DNS record and Traefik route for it first.
3. **Run the check** from a machine that can reach the endpoint:
   `EMBED_BASE_URL=... EMBED_API_KEY=... python scripts/test_embed.py`
   It generates one embedding and must print `dims=768 expected=768 ... OK` (exit 0). Exit 1 means the wrong model/dimension
   or too slow; exit 2 means the endpoint is unreachable or rejects the key.
4. **Switch the provider and restart the API:** set `EMBED_PROVIDER=openai_compat` and recreate the container
   (`docker compose up -d --force-recreate api`). No image rebuild is needed; the value is read at start-up.
5. **Verify:** `curl https://rag.rangeltech.net/api/health` shows `"search_mode":"hybrid"` and `"embed_provider":"openai_compat"`;
   `curl 'https://rag.rangeltech.net/api/explore?q=merenda+escolar&mode=vector'` returns results with `"vector_available":true`.
   If anything looks wrong, set `EMBED_PROVIDER=none` and recreate: the API goes back to lexical search at once.

## Behaviour to know

- If the endpoint is slow or down while `openai_compat` is on, each search silently falls back to lexical for that request
  (each embed call is bounded by `EMBED_TIMEOUT_S`=8 s and `EMBED_ATTEMPTS`=2, so a dead endpoint makes searches slower, not wrong). Prefer
  switching back to `none` when the GPU is turned off.
- The chat model (answer wording) is a separate setting (`QWEN_BASE_URL`/`LLM_BASE_URL`, `*_API_KEY`, `*_MODEL`) and does not
  depend on embeddings.
