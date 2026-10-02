import type { Metadata } from "next";
import { SiteHeader } from "../../components/site-header";
import { articles } from "../../lib/articles";

export const metadata: Metadata = {
  title: "Articles | Lucas Rangel",
  description: "Engineering notes on data platforms, ML systems, retrieval and model serving, each tied to a public repository.",
};

const series = ["Case notes", "Run your own model", "The public data stack"] as const;
const blurb: Record<(typeof series)[number], string> = {
  "Case notes": "One project per article: the decision, the evidence and the limit.",
  "Run your own model": "A tutorial series on serving, benchmarking and operating a 27B open model on one rented GPU.",
  "The public data stack": "Postgres for search and BI, a read-only SQL agent, and dashboards inside a portfolio.",
};

export default function ArticlesIndex() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="py-16 outline-none md:py-24">
        <p className="mb-4 font-mono text-xs font-medium tracking-[0.08em] text-accent">WRITING</p>
        <h1 className="max-w-[760px] text-[clamp(36px,5vw,56px)] font-extrabold leading-[1.05] tracking-[-0.05em]">
          Engineering notes, with the numbers and the limits.
        </h1>
        <p className="mt-6 max-w-[680px] text-lg leading-relaxed text-muted">
          Every number in these articles traces to a file in a public repository. Where a result was not measured, the
          article says so.
        </p>

        <div className="mt-16 grid gap-16">
          {series.map((name) => (
            <section key={name} aria-labelledby={`series-${name}`} className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
              <div>
                <h2 id={`series-${name}`} className="text-xl font-bold tracking-[-0.02em]">
                  {name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{blurb[name]}</p>
              </div>
              <ol className="m-0 grid list-none gap-0 p-0">
                {articles
                  .filter((article) => article.series === name)
                  .map((article) => (
                    <li key={article.slug} className="border-t border-line first:border-t-0 lg:first:border-t">
                      <a
                        href={`/articles/${article.slug}/`}
                        className="group grid grid-cols-[40px_minmax(0,1fr)] gap-4 py-5 transition-colors duration-200 sm:grid-cols-[48px_minmax(0,1fr)_auto]"
                      >
                        <span className="pt-1 font-mono text-[13px] text-muted">{article.number}</span>
                        <span>
                          <span className="block text-[17px] font-bold leading-snug transition-colors duration-200 group-hover:text-accent">
                            {article.title}
                          </span>
                          <span className="mt-1.5 block text-[15px] leading-relaxed text-muted">{article.subtitle}</span>
                        </span>
                        <span className="col-start-2 font-mono text-[12px] text-muted sm:col-start-3 sm:pt-1">
                          {article.readMinutes} min
                        </span>
                      </a>
                    </li>
                  ))}
              </ol>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
