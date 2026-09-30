import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function DashboardShell({ kicker, title, lead, children }: { kicker: string; title: string; lead: string; children: ReactNode }) {
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
      </main>
    </div>
  );
}
