import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`axe: no serious or critical violations at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: "reduce" }); // audit final colors, not mid-fade opacity
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();

    const blocking = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
    const summary = blocking.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target).join(", ")}`);
    expect(summary, summary.join("\n")).toEqual([]);

    const minor = results.violations.filter((violation) => !blocking.includes(violation));
    test.info().annotations.push({
      type: "axe",
      description: `${results.passes.length} rules passed; ${minor.length} minor/moderate: ${minor.map((v) => v.id).join(", ") || "none"}`,
    });
  });
}
