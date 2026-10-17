// Captures full-page screenshots of the static export for docs/mobile-visual-review.md.
// Usage: npm run build && npm run screenshots
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";

const port = 4174;
const date = new Date().toISOString().slice(0, 10);
const widths = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

const server = spawn(process.execPath, ["scripts/serve-out.mjs"], { env: { ...process.env, PORT: String(port) } });
await new Promise((resolve, reject) => {
  server.stdout.on("data", (chunk) => chunk.toString().includes("Serving") && resolve());
  server.on("exit", (code) => reject(new Error(`static server exited with ${code}`)));
});

mkdirSync("docs/evidence", { recursive: true });
const browser = await chromium.launch();
try {
  for (const viewport of widths) {
    const page = await browser.newPage({ viewport });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
    // Scroll like a visitor so every fade-in block reaches its final state.
    for (let y = 0; y < (await page.evaluate(() => document.body.scrollHeight)); y += viewport.height / 2) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    const path = `docs/evidence/${date}-home-${viewport.width}.png`;
    await page.screenshot({ path, fullPage: true });
    console.log(`saved ${path}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
