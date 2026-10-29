import { ui, type Lang } from "../content/i18n";

export function SiteHeader({ lang = "en" }: { lang?: Lang }) {
  const t = ui[lang];
  const base = lang === "pt" ? "/pt/" : "/";
  const navItems = [
    [`${base}#demos`, t.nav.demos],
    [`${base}#work`, t.nav.work],
    [`${base}#career`, t.nav.career],
    ["/articles/", t.nav.articles],
    [`${base}#contact`, t.nav.contact],
  ] as const;
  return (
    <header className="sticky top-0 z-40 -mx-5 border-b border-line bg-paper/85 px-5 backdrop-blur-md sm:-mx-8 sm:px-8">
      <nav aria-label="Primary" className="flex h-[72px] items-center justify-between gap-4">
        <a
          href={base}
          aria-label={t.homeLabel}
          className="grid size-[38px] flex-none place-items-center rounded-xl bg-ink font-mono text-[13px] font-medium text-white"
        >
          LR
        </a>
        <ul className="flex min-w-0 items-center gap-4 overflow-x-auto text-sm text-muted sm:gap-7">
          {navItems.map(([href, label]) => (
            <li key={href}>
              <a href={href} className="whitespace-nowrap transition-colors duration-200 hover:text-ink">
                {label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={t.switchHref}
          hrefLang={lang === "pt" ? "en" : "pt-BR"}
          lang={lang === "pt" ? "en" : "pt-BR"}
          title={t.switchTitle}
          className="flex-none whitespace-nowrap rounded-full border border-line px-3 py-1 font-mono text-[12px] font-medium text-ink transition-colors duration-200 hover:border-accent hover:text-accent"
        >
          {t.switchLabel}
        </a>
      </nav>
    </header>
  );
}
