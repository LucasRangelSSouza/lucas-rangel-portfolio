import { readFileSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";
import catalog from "../content/articles.json";

export type Article = (typeof catalog)[number];
export const articles: Article[] = catalog;

/**
 * Renders an article from public/medium/<slug>/article.md (copied there by
 * scripts/sync-articles.mjs). Figures are served from the same folder; the title,
 * subtitle and the closing portfolio line are dropped because the page shows them.
 */
export function renderArticle(article: Article): { html: string } {
  const source = readFileSync(join(process.cwd(), "public", "medium", article.slug, "article.md"), "utf8").replace(/\r\n?/g, "\n");
  const body = source
    .replace(/^\s*#\s+.+\n+/, "")
    .replace(/^###\s+.+\n+/, "")
    .replace(/\n+My portfolio:.*\s*$/, "\n");
  const renderer = new marked.Renderer();
  renderer.image = ({ href, text }) => {
    const src = /^(https?:|\/)/.test(href) ? href : `/medium/${article.slug}/${href}`;
    return `<img src="${src}" alt="${text.replace(/"/g, "&quot;")}" loading="lazy" />`;
  };
  renderer.link = ({ href, title, text }) => {
    const external = /^https?:/.test(href);
    return `<a href="${href}"${title ? ` title="${title}"` : ""}${external ? ' target="_blank" rel="noreferrer"' : ""}>${text}</a>`;
  };
  return { html: marked.parse(body, { renderer, async: false }) as string };
}
