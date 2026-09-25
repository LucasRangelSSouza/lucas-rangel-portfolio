# Denied content

This list states what must never appear on the site or in this repository. `tests/content.test.mjs` enforces it on every run of `npm test`, and CI runs that test on every push and pull request.

| Category | Rule | How the test enforces it |
|---|---|---|
| Home address | No street, number, neighborhood, city of residence, or postal code. | Rejects address words (street, avenue, block, lot), Brazilian postal codes, and fragments of the known address. |
| Telephone number | No phone number in any format, including the one in the resume. | Rejects phone-shaped numbers, `+55` prefixes, and long digit runs in site sources. |
| Email addresses | Only the public professional address `lucas.rangel@outlook.com`. | Rejects any other email address in tracked text files. |
| Employer-internal systems | No internal platform, project, lake, dataset, repository, dashboard, or account name from any employer. | Checks a private term list (see below). |
| Client names and metrics | No customer or client name, and no metric from client work. | Checks the same private term list, and rejects percentage claims in site content. |
| Private infrastructure | No domain, hostname, IP address, SSH target, VPS name, DNS provider record, or deploy workflow for personal infrastructure. | Allows only `github.com`, `www.kaggle.com`, and `www.linkedin.com` links in site sources; rejects IPv4 addresses other than loopback and wildcard in every tracked text file; rejects SSH and deploy steps in workflows. |
| Unverified claims | No "production-ready", "enterprise-grade", certification, scale figure, business outcome, or "cloud validated" claim without a dated record. | Rejects those phrases in site content and the README. |

## Private term list

Names of employers' internal systems and of clients cannot be listed here, because listing them in a public file would publish them. They live in `.denied-terms.local` at the repository root, one term per line, and `.gitignore` excludes that file. When the file exists, the content test fails if any term appears in a tracked text file. When it is absent, as in CI, the test reports that it skipped this check.

## Allowed

The public professional email, the GitHub profile and repositories, the LinkedIn URL published on the GitHub profile, the two public Kaggle datasets, the portrait Lucas supplied, the evidence facts recorded in [PUBLIC_FACTS.md](../PUBLIC_FACTS.md), and a role-area career timeline without system or client names.
