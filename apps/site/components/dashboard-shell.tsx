import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export type Origin = { label: string; href: string; note: string };

export function DashboardShell({ kicker, title, lead, children, origin }: { kicker: string; title: string; lead: string; children: ReactNode; origin?: Origin[] }) {
  return (
    <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
      <header className="flex h-[88px] items-center justify-between border-b border-line">
        <a href="/" className="inline-flex items-center gap-2 font-mono text-[13px] font-medium text-ink transition-colors hover:text-accent">
          <ArrowLeft size={16} aria-hidden /> Back to portfolio
        </a>
        <nav aria-label="Dashboards" className="flex gap-5 font-mono text-[13px] font-medium">
          <a href="/dashboards/pncp/" className="hover:text-accent">PNCP</a>
          <a href="/dashboards/siope/" className="hover:text-accent">SIOPE</a>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="py-14 outline-none md:py-20">
        <p className="mb-5 font-mono text-xs font-medium tracking-[0.08em] text-accent">{kicker}</p>
        <h1 className="max-w-[820px] text-[clamp(32px,5vw,52px)] font-extrabold leading-[1.08] tracking-[-0.05em]">{title}</h1>
        <p className="mt-6 max-w-[760px] text-lg leading-relaxed text-muted">{lead}</p>
        <div className="mt-12 grid gap-10">{children}</div>
        {origin?.length ? (
          <section aria-labelledby="origin" className="mt-16 border-t border-line pt-10">
            <h2 id="origin" className="text-2xl font-bold tracking-[-0.03em]">Where this comes from</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {origin.map((item) => (
                <li key={item.href} className="rounded-2xl border border-line p-5">
                  <a className="font-mono text-[13px] font-medium text-accent-ink underline underline-offset-4" href={item.href} {...(item.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                    {item.label}{item.href.startsWith("http") ? <span className="sr-only"> (opens in a new tab)</span> : null}
                  </a>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.note}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
