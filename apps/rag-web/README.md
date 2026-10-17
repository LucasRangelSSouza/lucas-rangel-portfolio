# rag-web

Static (`next export`) interface of RAG Chat, served at rag.rangeltech.net by the `portfolio-web` image.
There is no server runtime and no route handler: the page calls `/api/answer`, `/api/explore` and `/api/health` on its
own origin, and the edge proxy sends `/api/*` to `portfolio-api` (see `apps/api`).

```bash
npm ci
npm run dev        # next dev on :3000; /api/* needs portfolio-api behind a proxy, or mock it as the e2e tests do
npm run check      # typecheck + static export to out/
npm run test:e2e   # Playwright, API mocked in the tests
```

The health payload drives the badges: `status` (`ready`, `degraded` when the database is unreachable, `pending`,
`unavailable`), `model_status`, and `search_mode` (`lexical` while embeddings are off, `hybrid` when vectors are used).
Answers carry the same `search_mode`.

History: this app was imported from the former `rag-chat` repository (origin commit f498dcf) with `git subtree`.
