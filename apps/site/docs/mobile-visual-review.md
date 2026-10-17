# Mobile and responsive visual review

**Date:** 2026-09-25
**Source:** `npm run build && npm run screenshots`, which serves the static export and captures a full-page screenshot per viewport after scrolling through every fade-in section.

| Viewport | Screenshot | Alt text |
|---|---|---|
| 390×844 (mobile) | [2026-09-25-home-390.png](evidence/2026-09-25-home-390.png) | Home page at mobile width: single-column hero, portrait below the statement, one-column project cards, stacked contact rows. No horizontal scroll. |
| 768×1024 (tablet) | [2026-09-25-home-768.png](evidence/2026-09-25-home-768.png) | Home page at tablet width: hero text and portrait side by side, project cards in two columns. |
| 1440×900 (desktop) | [2026-09-25-home-1440.png](evidence/2026-09-25-home-1440.png) | Home page at desktop width: hero text and portrait side by side, project cards in three columns, capability groups in a four-column row. |

## Checklist

- [x] No horizontal scroll at 390, 768, or 1440px (enforced in `tests/e2e/responsive.spec.ts`; confirmed again visually here).
- [x] Project cards reflow 1 → 2 → 3 columns across the three widths.
- [x] Navigation and portrait stay visible and are not clipped at any width.
- [x] Body text stays legible (no columns narrower than a comfortable reading measure) at all three widths.
- [x] Touch targets (nav links, card links, contact rows) are not visually crowded at 390px.
- [x] Fade-in sections reach their final, fully visible state after scrolling (screenshots are captured post-scroll, not mid-animation).
- [x] `prefers-reduced-motion` is separately covered in `tests/e2e/interaction.spec.ts` (animated blocks render at once, without offset), not by this visual pass.
- [x] Dark backgrounds/light text pairs meet contrast: covered by the axe accessibility run (`tests/e2e/accessibility.spec.ts`), zero serious/critical violations at all three widths.

## Known limitation

This is a single-page site; the review covers the home page only. There is no second route to check beyond the static `404.html`.
