"use client";

import { Search } from "lucide-react";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

type Item = { slug: string; number: string; title: string; subtitle: string; tags: string[]; series: string };

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Scores an article against the query: words in the title weigh most, then tags, then track and subtitle. */
function score(item: Item, words: string[]) {
  const title = normalize(item.title);
  const tags = normalize(item.tags.join(" "));
  const rest = normalize(`${item.series} ${item.subtitle} ${item.number}`);
  let total = 0;
  for (const word of words) {
    const hit = (3 * Number(title.includes(word))) + (2 * Number(tags.includes(word))) + Number(rest.includes(word));
    if (!hit) return 0; // every word must appear somewhere
    total += hit;
  }
  return total;
}

export function ArticleSearch({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter((w) => w.length > 1);
    if (!words.length) return [];
    return items
      .map((item) => ({ item, s: score(item, words) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map((r) => r.item);
  }, [items, query]);

  const go = (item: Item) => {
    window.location.href = `/articles/${item.slug}/`;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && query.trim().length > 1;

  return (
    <div className="relative max-w-[680px]">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search articles
      </label>
      <div className="flex items-center gap-3 rounded-[14px] border border-line bg-white px-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors focus-within:border-accent">
        <Search size={18} className="flex-none text-muted" aria-hidden />
        <input
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${listId}-${results[active].slug}` : undefined}
          autoComplete="off"
          placeholder="Search articles: pgvector, agents, recommender, cost..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={onKeyDown}
          className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
      </div>
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-2 max-h-[420px] overflow-auto rounded-[14px] border border-line bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
        >
          {results.length ? (
            results.map((item, index) => (
              <li
                key={item.slug}
                id={`${listId}-${item.slug}`}
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  go(item);
                }}
                className={`cursor-pointer rounded-[10px] px-3 py-2.5 ${index === active ? "bg-slate-100" : ""}`}
              >
                <span className="block font-mono text-[11px] font-medium tracking-[0.06em] text-accent">
                  {item.number} · {item.series.toUpperCase()}
                </span>
                <span className="mt-0.5 block text-[15px] font-semibold leading-snug">{item.title}</span>
              </li>
            ))
          ) : (
            <li className="px-3 py-2.5 text-sm text-muted">No article matches “{query.trim()}”.</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
