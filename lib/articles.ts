import { readFileSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";
import type { Article } from "../content/articles";

const GITHUB = "https://github.com/LucasRangelSSouza";

/** Renders an article's Markdown to HTML; relative repository links become absolute GitHub links. */
export function renderArticle(article: Article): { html: string } {
  const source = readFileSync(join(process.cwd(), "content", "articles", article.file), "utf8");
  const body = source.replace(/^\s*#\s+.+\n/, "");
  const renderer = new marked.Renderer();
  renderer.link = ({ href, title, text }) => {
    let target = href;
    if (!/^(https?:|mailto:|#)/.test(href)) {
      const path = href.replace(/^(\.\.\/|\.\/)+/, "");
      target = `${GITHUB}/${article.repo}/blob/main/${path}`;
    }
    const external = /^https?:/.test(target);
    return `<a href="${target}"${title ? ` title="${title}"` : ""}${external ? ' target="_blank" rel="noreferrer"' : ""}>${text}</a>`;
  };
  return { html: marked.parse(body, { renderer, async: false }) as string };
}
