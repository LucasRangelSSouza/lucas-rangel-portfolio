"use client";

import { ArrowUpRight, Search } from "lucide-react";
import { useState, type FormEvent } from "react";

type Result = {
  id: string;
  org: string | null;
  municipality: string | null;
  uf: string | null;
  modality: string | null;
  published: string;
  text: string;
  link: string | null;
  rank: number;
};
type Payload = { total: number; results: Result[]; vector_available: boolean };
type State = { status: "idle" } | { status: "loading" } | { status: "error"; message: string } | { status: "done"; payload: Payload; query: string };

const ENDPOINT = process.env.NEXT_PUBLIC_EXPLORE_URL || "/api/explore";

const PANELS = [
  {
    mode: "text" as const,
    title: "Text search",
    kicker: "POSTGRES FULL-TEXT",
    hint: "Matches the words of your query in the notice text, using Portuguese stemming.",
    placeholder: "e.g. merenda escolar",
    examples: ["merenda escolar", "transporte escolar", "medicamentos"],
  },
  {
    mode: "vector" as const,
    title: "Semantic search",
    kicker: "PGVECTOR · 768-DIMENSION EMBEDDINGS",
    hint: "Finds notices with a similar meaning, even when they use different words. Ask in English or Portuguese.",
    placeholder: "e.g. buying food for students",
    examples: ["buying food for students", "reforma de escolas", "internet para unidades de saúde"],
  },
];

function Panel({ panel }: { panel: (typeof PANELS)[number] }) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function run(query: string) {
    const q = query.trim();
    if (q.length < 3) return;
    setState({ status: "loading" });
    try {
      const response = await fetch(`${ENDPOINT}?mode=${panel.mode}&q=${encodeURIComponent(q)}&limit=12`, { cache: "no-store", signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(response.status === 429 ? "Too many searches. Wait a moment and try again." : "The search service is unavailable. Try again shortly.");
      setState({ status: "done", payload: (await response.json()) as Payload, query: q });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "The search service is unavailable." });
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void run(value);
  }

  const id = `search-${panel.mode}`;
  return (
    <section aria-labelledby={`${id}-title`} className="flex min-w-0 flex-col rounded-[20px] border border-line bg-white p-6">
      <p className="font-mono text-xs font-medium tracking-[0.08em] text-accent">{panel.kicker}</p>
      <h2 id={`${id}-title`} className="mt-3 text-2xl font-bold tracking-[-0.03em]">
        {panel.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{panel.hint}</p>
      <form onSubmit={submit} className="mt-5 flex gap-2" role="search">
        <label htmlFor={id} className="sr-only">
          {panel.title}
        </label>
        <input
          id={id}
          value={value}
          onChange={(event) => setValue(event.target.value.slice(0, 200))}
          placeholder={panel.placeholder}
          className="min-h-12 w-full min-w-0 rounded-xl border border-line bg-paper px-4 text-[15px] outline-none transition-colors placeholder:text-[#7c8798] focus:border-accent"
        />
        <button
          type="submit"
          disabled={value.trim().length < 3 || state.status === "loading"}
          className="inline-flex min-h-12 flex-none items-center gap-2 rounded-xl border border-ink bg-ink px-5 text-sm font-bold text-white transition-colors hover:bg-[#1f2a3d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search size={16} aria-hidden /> Search
        </button>
      </form>

      <div className="mt-5 min-h-[120px]" aria-live="polite">
        {state.status === "idle" ? (
          <div className="flex flex-wrap gap-2">
            {panel.examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setValue(example);
                  void run(example);
                }}
                className="rounded-full border border-line bg-paper px-3 py-1.5 text-[13px] text-ink transition-colors hover:border-[#c3cedb]"
              >
                {example}
              </button>
            ))}
          </div>
        ) : null}
        {state.status === "loading" ? (
          <p role="status" className="text-sm text-muted">
            Searching…
          </p>
        ) : null}
        {state.status === "error" ? (
          <p role="alert" className="rounded-xl border border-[#f2c4bd] bg-[#fff5f3] p-4 text-sm text-[#8a2a1c]">
            {state.message}
          </p>
        ) : null}
        {state.status === "done" && state.payload.results.length === 0 ? (
          <p className="text-sm text-muted">
            {panel.mode === "vector" && !state.payload.vector_available
              ? "Semantic search is not available right now. The text search on the left still works."
              : `No notice matched “${state.query}”.${panel.mode === "text" ? " Try fewer words, or use the semantic search." : ""}`}
          </p>
        ) : null}
        {state.status === "done" && state.payload.results.length > 0 ? (
          <>
            <p className="mb-3 text-[13px] text-muted">
              {panel.mode === "text" ? `${state.payload.total.toLocaleString("en-US")} matching notices, best ${state.payload.results.length} shown` : `${state.payload.results.length} most similar notices`}
            </p>
            <ol className="grid gap-3">
              {state.payload.results.map((result) => (
                <li key={result.id} className="rounded-2xl border border-line p-4">
                  <p className="text-[15px] font-bold leading-snug">{result.org ?? "Contracting organization not informed"}</p>
                  <p className="mt-1 font-mono text-[12px] text-muted">
                    {[result.municipality && result.uf ? `${result.municipality}/${result.uf}` : result.uf, result.modality, result.published].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{result.text}</p>
                  {result.link ? (
                    <a href={result.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-mono text-[12px] font-medium text-accent-ink hover:underline">
                      Open the notice on PNCP <ArrowUpRight size={14} aria-hidden />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : null}
                </li>
              ))}
            </ol>
          </>
        ) : null}
      </div>
    </section>
  );
}

export function Explorer() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {PANELS.map((panel) => (
        <Panel key={panel.mode} panel={panel} />
      ))}
    </div>
  );
}
