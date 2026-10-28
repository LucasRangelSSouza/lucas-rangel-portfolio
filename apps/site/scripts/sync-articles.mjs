// Copies the article series from ../medium/v2 into the site.
//   node scripts/sync-articles.mjs [path/to/medium/v2]
// Each article lands in public/medium/<slug>/ (Markdown and figures), and content/articles.json lists them for
// the site, grouped by track. The manifest is built by medium/v2/build_manifest.py.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const source = process.argv[2] ?? join("..", "medium", "v2");
const target = join("public", "medium");
const manifest = JSON.parse(readFileSync(join(source, "manifest.json"), "utf8"));

// Only the manifest articles are replaced: the "GPU and AI benchmarks" series is synced by publish/tools/portfolio_sync.py and must survive.
const BENCHMARK_SERIES = "GPU and AI benchmarks";
const keep = existsSync("content/articles.json") ? JSON.parse(readFileSync("content/articles.json", "utf8")).filter((a) => a.series === BENCHMARK_SERIES) : [];
for (const entry of manifest) rmSync(join(target, entry.slug), { recursive: true, force: true });
const articles = manifest.map((entry) => {
  const from = join(source, entry.folder);
  const to = join(target, entry.slug);
  mkdirSync(to, { recursive: true });
  for (const file of readdirSync(from)) {
    if (/\.(md|png|jpg|svg)$/.test(file)) copyFileSync(join(from, file), join(to, file));
  }
  return {
    slug: entry.slug,
    number: entry.id,
    title: entry.title,
    subtitle: entry.subtitle,
    tags: entry.tags,
    readMinutes: Math.max(1, Math.round(entry.words / 230)),
    series: entry.track,
  };
});

writeFileSync("content/articles.json", `${JSON.stringify(articles, null, 2)}\n`);
console.log(`synced ${articles.length} articles into ${target}`);
