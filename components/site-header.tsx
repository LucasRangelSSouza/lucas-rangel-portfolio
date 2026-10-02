const navItems = [
  ["/#demos", "Demos"],
  ["/#work", "Work"],
  ["/#career", "Career"],
  ["/articles/", "Articles"],
  ["/#contact", "Contact"],
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 -mx-5 border-b border-line bg-paper/85 px-5 backdrop-blur-md sm:-mx-8 sm:px-8">
      <nav aria-label="Primary" className="flex h-[72px] items-center justify-between gap-4">
        <a
          href="/"
          aria-label="Lucas Rangel, home"
          className="grid size-[38px] flex-none place-items-center rounded-xl bg-ink font-mono text-[13px] font-medium text-white"
        >
          LR
        </a>
        <ul className="flex gap-4 overflow-x-auto text-sm text-muted sm:gap-7">
          {navItems.map(([href, label]) => (
            <li key={href}>
              <a href={href} className="whitespace-nowrap transition-colors duration-200 hover:text-ink">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
