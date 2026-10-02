// Runs after `next build`: the essential content must exist in the exported
// HTML itself, so a visitor without JavaScript still gets it.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("out/index.html", "utf8");

test("exported markup contains every essential section", () => {
  for (const id of ["main", "top", "demos", "work", "career", "articles", "contact"]) {
    assert.match(html, new RegExp(`id="${id}"`), `section #${id} missing from out/index.html`);
  }
});

test("exported markup contains the hero, contact channels, and project evidence", () => {
  for (const text of [
    "Senior Data &amp; AI Platform Engineer",
    "Systems that hold up when someone asks how they work.",
    "lucas.rangel@outlook.com",
    "https://github.com/LucasRangelSSouza",
    "https://www.kaggle.com/lucasrangelss/datasets",
    "https://rag.rangeltech.net",
    "Drogasil",
    "SENAI ITA",
    "/logos/drogasil.svg",
    "The code behind every demo and research project.",
    "Mechatronics Engineering",
  ]) {
    assert.ok(html.includes(text), `missing from out/index.html: ${text}`);
  }
});

test("hidden-until-hydration blocks are forced visible without JavaScript", () => {
  assert.match(html, /<noscript><style>\.reveal\{opacity:1!important;transform:none!important\}<\/style><\/noscript>/);
});

test("every article in the catalogue is exported with its figures", () => {
  const articles = JSON.parse(readFileSync("content/articles.json", "utf8"));
  const index = readFileSync("out/articles/index.html", "utf8");
  for (const article of articles) {
    assert.ok(index.includes(`/articles/${article.slug}/`), `article index misses ${article.slug}`);
    const page = readFileSync(`out/articles/${article.slug}/index.html`, "utf8");
    for (const [, src] of page.matchAll(/<img src="([^"]+)"/g)) {
      assert.ok(src.startsWith(`/medium/${article.slug}/`), `${article.slug}: figure ${src} not served locally`);
    }
  }
});
