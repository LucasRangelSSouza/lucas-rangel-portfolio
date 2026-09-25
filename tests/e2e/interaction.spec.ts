import { expect, test, type Page } from "@playwright/test";

// Links animate color changes, so the ring is polled until it settles on the accent.
async function expectFocusRing(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element || element === document.body) return "no focus";
        const style = getComputedStyle(element);
        return `${style.outlineStyle} ${parseFloat(style.outlineWidth)} ${style.outlineColor}`;
      }),
    )
    .toBe("solid 2 rgb(37, 99, 235)");
}

test.describe("section navigation", () => {
  for (const [label, id] of [
    ["Work", "work"],
    ["Experience", "experience"],
    ["Contact", "contact"],
  ] as const) {
    test(`primary nav reaches #${id}`, async ({ page }) => {
      await page.goto("/");
      await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id}`)).toBeInViewport();
      await expect(page.locator(`#${id} h2`)).toBeVisible();
    });
  }

  test("contact section exposes email, LinkedIn, and GitHub", async ({ page }) => {
    await page.goto("/#contact");
    const contact = page.locator("#contact");
    await expect(contact.getByRole("link", { name: /Email/ })).toHaveAttribute("href", "mailto:lucas.rangel@outlook.com");
    await expect(contact.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute("href", /linkedin\.com\/in\//);
    await expect(contact.getByRole("link", { name: /GitHub/ })).toHaveAttribute("href", "https://github.com/LucasRangelSSouza");
  });

  test("every project card links to its public repository", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("#work article");
    await expect(cards).toHaveCount(6);
    for (const card of await cards.all()) {
      await expect(card.getByRole("link").first()).toHaveAttribute("href", /^https:\/\/github\.com\/LucasRangelSSouza\//);
    }
  });
});

test.describe("keyboard-only flow", () => {
  test("skip link, then nav, then contact, all with a visible focus ring", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await expectFocusRing(page);

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Lucas Rangel, back to top" })).toBeFocused();
    await expectFocusRing(page);

    for (const label of ["Work", "Experience", "Contact"]) {
      await page.keyboard.press("Tab");
      await expect(page.getByRole("navigation").getByRole("link", { name: label })).toBeFocused();
      await expectFocusRing(page);
    }

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#contact$/);
    await expect(page.locator("#contact")).toBeInViewport();

    // Keep tabbing until focus lands on the contact email link.
    const email = page.locator("#contact").getByRole("link", { name: /Email/ });
    for (let step = 0; step < 40; step += 1) {
      if (await email.evaluate((node) => node === document.activeElement)) break;
      await page.keyboard.press("Tab");
    }
    await expect(email).toBeFocused();
    await expectFocusRing(page);
  });

  test("skip link moves focus to main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("animated blocks are shown at once, without offset", async ({ page }) => {
    await page.goto("/");
    // No scrolling: with reduced motion, blocks far below the fold are already final.
    const reveals = page.locator(".reveal");
    expect(await reveals.count()).toBeGreaterThan(0);
    for (const block of await reveals.all()) {
      await expect(block).toHaveCSS("opacity", "1");
      await expect(block).toHaveCSS("transform", /none|matrix\(1, 0, 0, 1, 0, 0\)/);
    }
    await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("essential content is readable", async ({ page }) => {
    await page.goto("/");
    for (const id of ["work", "capabilities", "experience", "contact"]) {
      await expect(page.locator(`#${id} h2`)).toBeVisible();
      await expect(page.locator(`#${id} .reveal`).first()).toHaveCSS("opacity", "1");
    }
    await expect(page.getByText("lucas.rangel@outlook.com").first()).toBeVisible();
  });
});
