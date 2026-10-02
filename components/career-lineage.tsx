"use client";

import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { Role } from "../content/portfolio";
import { cn } from "../lib/utils";

const FIRST_YEAR = 2014;
const now = new Date("2026-10-01");

const toMonths = (value: string | null) => {
  if (!value) return now.getFullYear() * 12 + now.getMonth();
  const [year, month] = value.split("-").map(Number);
  return year * 12 + (month - 1);
};

const formatMonth = (value: string | null) => {
  if (!value) return "now";
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

const duration = (role: Role) => {
  const months = toMonths(role.end) - toMonths(role.start) + 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years ? `${years} yr` : "", rest ? `${rest} mo` : ""].filter(Boolean).join(" ");
};

/** Year in which each tool first appears in the career data, oldest first. */
function adoption(roles: Role[]) {
  const first = new Map<string, number>();
  for (const role of [...roles].reverse()) {
    const year = Number(role.start.slice(0, 4));
    for (const tool of role.stack) if (!first.has(tool)) first.set(tool, year);
  }
  const byYear = new Map<number, string[]>();
  for (const [tool, year] of first) byYear.set(year, [...(byYear.get(year) ?? []), tool]);
  return [...byYear.entries()].sort(([a], [b]) => a - b);
}

function RoleDetail({ role }: { role: Role }) {
  return (
    <>
    <p className="font-mono text-xs font-medium tracking-[0.08em] text-accent">
      {formatMonth(role.start).toUpperCase()} – {formatMonth(role.end).toUpperCase()} · {duration(role).toUpperCase()}
    </p>
    <h3 className="mt-4 text-[28px] font-bold leading-tight tracking-[-0.03em]">{role.company}</h3>
    <p className="mt-1 text-base text-muted">
      {role.area} · {role.sector}
    </p>
    <ul className="mt-6 grid gap-3 text-[15px] leading-relaxed">
      {role.highlights.map((line) => (
        <li key={line} className="grid grid-cols-[16px_minmax(0,1fr)] gap-2">
          <span aria-hidden className="mt-[11px] h-px w-2.5 bg-accent" />
          {line}
        </li>
      ))}
    </ul>
    <ul className="mt-6 flex flex-wrap gap-2" aria-label="Stack">
      {role.stack.map((tool) => (
        <li key={tool} className="rounded-full border border-line bg-paper px-3 py-1 font-mono text-[12px] text-ink">
          {tool}
        </li>
      ))}
    </ul>
    </>
  );
}

export function CareerLineage({ roles }: { roles: Role[] }) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const start = FIRST_YEAR * 12;
  const span = toMonths(null) - start + 1;
  const years = Array.from({ length: now.getFullYear() - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);
  const role = roles[active];
  const chronological = roles.map((item, index) => ({ item, index })).reverse();

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="grid gap-8">
        {/* Desktop and tablet: proportional bar, one segment per employer. */}
        <div className="hidden md:block" aria-hidden="true">
          <div className="relative h-14 overflow-hidden rounded-2xl border border-line bg-white">
            {chronological.map(({ item, index }) => {
              const left = ((toMonths(item.start) - start) / span) * 100;
              const width = ((toMonths(item.end) - toMonths(item.start) + 1) / span) * 100;
              return (
                <button
                  key={item.company}
                  type="button"
                  tabIndex={-1}
                  onClick={() => setActive(index)}
                  title={item.company}
                  className={cn(
                    "absolute inset-y-1.5 rounded-[10px] border transition-colors duration-200",
                    index === active
                      ? "border-ink bg-ink"
                      : "border-[#c9d6ea] bg-[#eef4ff] hover:border-accent hover:bg-[#dfe9fd]",
                  )}
                  style={{ left: `calc(${left}% + 2px)`, width: `calc(${width}% - 4px)` }}
                >
                  {width > 7 ? (
                    <span
                      className={cn(
                        "block truncate px-2 text-left text-[12px] font-bold",
                        index === active ? "text-white" : "text-accent-ink",
                      )}
                    >
                      {item.company}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="relative mt-2 h-5 font-mono text-[11px] text-muted">
            {years.map((year) => (
              <span
                key={year}
                className="absolute -translate-x-1/2"
                style={{ left: `${(((year - FIRST_YEAR) * 12) / span) * 100}%` }}
              >
                {year % 2 === 0 ? year : ""}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <ol className="m-0 grid list-none gap-1 p-0" aria-label="Employers, newest first">
            {roles.map((item, index) => (
              <li key={item.company}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-pressed={index === active}
                  className={cn(
                    "grid w-full grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200",
                    index === active ? "bg-white shadow-[0_1px_0_#dce3ec,0_8px_24px_#1018280d]" : "hover:bg-white/70",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("size-2.5 rounded-full border-2", index === active ? "border-accent bg-accent" : "border-[#b8c4d4] bg-paper")}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-bold">{item.company}</span>
                    <span className="block truncate text-[13px] text-muted">{item.area}</span>
                  </span>
                  <span className="font-mono text-[12px] text-muted">
                    {item.start.slice(0, 4)}
                    {item.end?.slice(0, 4) === item.start.slice(0, 4) ? "" : `–${item.end ? item.end.slice(2, 4) : "now"}`}
                  </span>
                </button>
                {index === active ? (
                  <div className="mx-1 mb-3 mt-1 rounded-[20px] border border-line bg-white p-5 lg:hidden">
                    <RoleDetail role={item} />
                  </div>
                ) : null}
              </li>
            ))}
          </ol>

          <div className="relative hidden min-h-[320px] lg:block" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <m.article
                key={role.company}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[20px] border border-line bg-white p-6 md:p-8"
              >
                <RoleDetail role={role} />
              </m.article>
            </AnimatePresence>
          </div>
        </div>

        <section aria-labelledby="adoption-title" className="rounded-[20px] border border-line bg-white p-6 md:p-8">
          <h3 id="adoption-title" className="text-lg font-bold">
            When each tool entered the work
          </h3>
          <p className="mt-1 text-sm text-muted">First year a tool appears in a role above.</p>
          <ol className="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {adoption(roles).map(([year, tools]) => (
              <li key={year} className="border-t border-line pt-3">
                <p className="font-mono text-[13px] font-medium text-accent">{year}</p>
                <p className="mt-1 text-sm leading-relaxed">{tools.join(" · ")}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </LazyMotion>
  );
}
