import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 390, height: 844, columns: 1 },
  { name: "tablet", width: 768, height: 1024, columns: 2 },
  { name: "desktop", width: 1440, height: 900, columns: 3 },
];

for (const viewport of viewports) {
  test.describe(`${viewport.name} ${viewport.width}px`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("has no horizontal scroll", async ({ page }) => {
      await page.goto("/");
      const overflow = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);

      const wide = await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter((node) => node.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
          .filter((node) => !node.closest(".sr-only"))
          .map((node) => node.tagName + (node.id ? `#${node.id}` : "")),
      );
      expect(wide).toEqual([]);
    });

    test(`lays project cards in ${viewport.columns} column(s)`, async ({ page }) => {
      await page.goto("/");
      const lefts = await page
        .locator("#work article")
        .evaluateAll((cards) => [...new Set(cards.map((card) => Math.round(card.getBoundingClientRect().left)))]);
      expect(lefts).toHaveLength(viewport.columns);
    });

    test("keeps the nav and portrait visible", async ({ page }) => {
      await page.goto("/");
      for (const label of ["Work", "Experience", "Contact"]) {
        await expect(page.getByRole("navigation").getByRole("link", { name: label })).toBeVisible();
      }
      const portrait = page.getByRole("img", { name: "Lucas Rangel at work" });
      await expect(portrait).toBeVisible();
      expect(await portrait.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    });
  });
}
