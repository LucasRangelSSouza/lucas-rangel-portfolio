# v0.2.0 verification record

**Date:** 2026-09-25
**Environment:** Windows 11, Node 24, Docker Desktop

## Local checks

```powershell
npm ci
npm run check       # content tests, typecheck, static export build, exported-markup tests, internal link check
npm run test:links:external
npm run test:e2e    # Playwright interaction, accessibility (axe), responsive
npm run lighthouse
```

- `npm run check`: 7 content tests, typecheck, production static export, 3 exported-markup tests, internal link check — all passed.
- External link check: all 9 non-LinkedIn links (6 GitHub repos, the GitHub profile, 2 Kaggle datasets) returned `200`. LinkedIn is excluded from the automated external check because it blocks the script's request; a manual `curl` with a browser user agent got a `301` to the same URL with its trailing slash stripped — LinkedIn's own canonicalization of a real profile, not a broken link.
- Playwright: 21/21 passed — section navigation, contact channels, every project card linking to its public repo, keyboard-only flow with a visible focus ring, `prefers-reduced-motion` behavior, the no-JavaScript content fallback, and responsive layout (1/2/3-column project cards) at 390/768/1440px with no horizontal scroll.
- axe accessibility: zero serious or critical violations at 390, 768, and 1440px.

## Lighthouse

Three runs each against the static export's `index.html` and `404.html` (`lighthouserc.json`, thresholds: performance ≥ 0.90, accessibility ≥ 0.95). All six runs passed the assertions.

| Page | Performance | Accessibility |
|---|---:|---:|
| `index.html` | 0.93 | 1.00 |
| `404.html` | 1.00 | 0.98 |

## Docker

```powershell
docker build -t lucas-rangel-portfolio:0.1.0 .
docker run -d -p 127.0.0.1:8090:8080 lucas-rangel-portfolio:0.1.0
```

`GET /` returned `200`, `GET /nonexistent` returned `404` with the exported `404.html`. Response headers included `X-Frame-Options: DENY` and a `Content-Security-Policy`; `server_tokens off` hid the nginx version.

A real Chromium load against the running container found zero console errors and correctly rendered title (`Lucas Rangel | Data & AI Platform Engineer`) and hero heading — this caught and fixed a real defect: an initial `script-src 'self'` (no `'unsafe-inline'`) CSP blocked Next.js's inlined hydration payload and produced 26 CSP console errors with a blank title. The policy now allows inline scripts and styles, which this static site needs and which carries no injection risk because the page reflects no user input.

## Mobile visual review

See [docs/mobile-visual-review.md](../mobile-visual-review.md) for the three-viewport screenshot review.
