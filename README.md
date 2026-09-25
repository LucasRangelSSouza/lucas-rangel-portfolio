# Lucas Rangel portfolio

This repository is the personal portfolio website for Lucas Rangel, a Senior Data & AI Platform Engineer. It links public work to its runnable evidence and keeps professional background separate from confidential systems and customer data.

## What the site includes

- six public portfolio projects, each linked to its GitHub repository and labeled with an evidence state (implemented, locally validated, or published dataset);
- links to the two published Kaggle datasets;
- a concise professional timeline covering software, data, machine learning, and cloud engineering;
- contact through a public professional email, LinkedIn, and GitHub;
- a documented public-content boundary in [PUBLIC_FACTS.md](PUBLIC_FACTS.md) and [docs/denied-content.md](docs/denied-content.md), enforced by an automated test on every push.

The site does not publish a residential address, telephone number, customer data, internal architecture, credentials, or unsupported performance claims.

## Stack

Next.js (static export, `output: "export"`), React, TypeScript, Tailwind CSS, local shadcn-style primitives ([components/ui](components/ui)), Lucide icons, and Framer Motion animation that respects `prefers-reduced-motion`. No database, analytics tracker, contact-form backend, or personal-infrastructure configuration.

## Local run

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```powershell
npm run check              # content-boundary tests, typecheck, static export build, exported-markup tests, internal link check
npm run test:links:external
npm run test:e2e           # Playwright: navigation, keyboard flow, reduced motion, no-JS fallback, axe accessibility, responsive layout
npm run lighthouse         # performance >= 0.90, accessibility >= 0.95 against the static export
```

The [2026-09-25 verification record](docs/evidence/2026-09-25-verification.md) has the last run's numbers (Lighthouse: performance 0.93 / accessibility 1.00 on the home page) and the [mobile visual review](docs/mobile-visual-review.md) has dated screenshots at 390/768/1440px.

## Architecture

Static-first Next.js with typed local content (`content/portfolio.ts`). Essential content renders without JavaScript (verified in `tests/e2e/interaction.spec.ts` and `tests/build/static-export.test.mjs`). The build produces a portable static export (`out/`); a `Dockerfile` serves it with an unprivileged nginx image and no server identifying headers — verified locally with a real browser load and zero console errors. A separate private infrastructure repository owns the domain, TLS, DNS, and deployment; this repository contains no hostname, IP address, SSH target, or deploy workflow for personal infrastructure.

## CI

GitHub Actions runs the content tests, Playwright (with axe) against a real Chromium, and the production build, and uploads the static export as a preview artifact. It deploys nothing and holds no secret.

## License

Apache-2.0. See [LICENSE](LICENSE).
