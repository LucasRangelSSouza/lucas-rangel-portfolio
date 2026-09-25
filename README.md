# Lucas Rangel portfolio

This repository contains the personal portfolio website for Lucas Rangel, a Senior Data & AI Platform Engineer. The site links public work to its runnable evidence and keeps professional background separate from confidential systems and customer data.

## What the site includes

- six public portfolio projects, each linked to its GitHub repository;
- a concise professional timeline covering software, data, machine learning, and cloud engineering;
- contact through a public professional email and GitHub;
- a documented public-content boundary in [PUBLIC_FACTS.md](PUBLIC_FACTS.md).

The site does not publish a residential address, telephone number, customer data, internal architecture, credentials, or unsupported performance claims.

## Local run

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. Run the production gate with:

```powershell
npm run check
```

`npm run check` runs content-boundary tests and the Next.js production build.

## Architecture

The application is static-first Next.js with typed local content. It has no database, analytics tracker, contact-form backend, or personal-infrastructure configuration. The public repository produces a portable build only. A separate private infrastructure repository owns any deployment, DNS, TLS, and credentials.

## Verification status

The initial production build and desktop visual review ran locally on 2026-09-25. The public website and its future deployment are separate milestones; no public domain or cloud-hosting claim is made here.

## License

Apache-2.0. See [LICENSE](LICENSE).
