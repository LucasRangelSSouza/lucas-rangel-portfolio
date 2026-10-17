# Project memory

## Scope

Personal public portfolio website for Lucas Rangel. It presents reviewed public professional facts and links to the six flagship repositories and the two published Kaggle datasets.

## Current state

- v0.2.0: migrated from plain CSS to Tailwind CSS with local shadcn-style primitives and Framer Motion (reduced-motion aware); static export (`output: "export"`); essential content renders without JavaScript.
- Content links both published Kaggle datasets (`brazil-pncp-procurement-history`, `brazil-education-data-lake`) and all six flagship repos.
- Contact: public email, LinkedIn, and GitHub. No phone, no address.
- [2026-09-25 verification record](docs/evidence/2026-09-25-verification.md): `npm run check` (content/typecheck/build/static-export/link-check) passed; 21/21 Playwright tests passed including axe (zero serious/critical violations at 390/768/1440px); Lighthouse performance 0.93 / accessibility 1.00 on the home page (both above the 0.90/0.95 thresholds in `lighthouserc.json`); all 9 checkable external links returned 200.
- Docker: `Dockerfile` serves the static export with `nginxinc/nginx-unprivileged:1.30.5-alpine` (digest-pinned). A real-browser smoke test caught and fixed a CSP bug (`script-src 'self'` with no `'unsafe-inline'` blocked Next's hydration payload, 26 console errors, blank title) — fixed by allowing inline scripts/styles, which this static, no-user-input site does not need to restrict.
- [Mobile visual review](docs/mobile-visual-review.md): dated screenshots at 390/768/1440px, no horizontal scroll, correct column reflow.
- CI: content tests, typecheck, build, Playwright+axe against real Chromium, uploads the static export as a preview artifact. No deploy step, no secret.
- The private infrastructure repository still owns domain, TLS, DNS, and deployment — none of that exists in this repository.

## Next verifiable task

Get explicit approval for the public domain name, then hand the pinned static image to the private infrastructure repository for its own host-exposure review before any public deployment.
