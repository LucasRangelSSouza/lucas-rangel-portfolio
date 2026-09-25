// Runs after `next build`: the essential content must exist in the exported
// HTML itself, so a visitor without JavaScript still gets it.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("out/index.html", "utf8");

test("exported markup contains every essential section", () => {
  for (const id of ["main", "top", "work", "capabilities", "experience", "contact"]) {
    assert.match(html, new RegExp(`id="${id}"`), `section #${id} missing from out/index.html`);
  }
});

test("exported markup contains the hero, contact channels, and project evidence", () => {
  for (const text of [
    "Senior Data &amp; AI Platform Engineer",
    "Systems that hold up when someone asks how they work.",
    "lucas.rangel@outlook.com",
    "https://github.com/LucasRangelSSouza",
    "https://www.kaggle.com/datasets/lucasrangelss/brazil-pncp-procurement-history",
    "https://www.kaggle.com/datasets/lucasrangelss/brazil-education-data-lake",
    "Cloud not validated.",
    "Locally validated",
    "Published dataset",
  ]) {
    assert.ok(html.includes(text), `missing from out/index.html: ${text}`);
  }
});

test("hidden-until-hydration blocks are forced visible without JavaScript", () => {
  assert.match(html, /<noscript><style>\.reveal\{opacity:1!important;transform:none!important\}<\/style><\/noscript>/);
});
