// Copies the publish-ready articles from ../medium/publish into the site.
//   node scripts/sync-articles.mjs [path/to/medium/publish]
// Each article lands in public/medium/<slug>/ (Markdown, figures and the import page that
// Medium's "Import a story" reads), and content/articles.json lists them for the site.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const source = process.argv[2] ?? join("..", "medium", "publish");
const target = join("public", "medium");
const manifest = JSON.parse(readFileSync(join(source, "manifest.json"), "utf8"));
const mediumUrls = existsSync("content/medium-urls.json")
  ? JSON.parse(readFileSync("content/medium-urls.json", "utf8"))
  : {};

const series = (number) => {
  const n = Number(number);
  if (n >= 11 && n <= 15) return "Run your own model";
  if (n >= 16) return "The public data stack";
  return "Case notes";
};

rmSync(target, { recursive: true, force: true });
const articles = manifest.map((entry) => {
  const from = join(source, entry.slug);
  const to = join(target, entry.slug);
  mkdirSync(to, { recursive: true });
  for (const file of readdirSync(from)) {
    if (/\.(md|png|jpg|svg|html)$/.test(file)) copyFileSync(join(from, file), join(to, file));
  }
  return {
    slug: entry.slug,
    number: entry.number,
    title: entry.title,
    subtitle: entry.subtitle,
    tags: entry.tags,
    readMinutes: Math.max(1, Math.round(entry.words / 230)),
    series: series(entry.number),
    medium: mediumUrls[entry.slug] ?? null,
  };
});

writeFileSync("content/articles.json", `${JSON.stringify(articles, null, 2)}\n`);
console.log(`synced ${articles.length} articles into ${target}`);
