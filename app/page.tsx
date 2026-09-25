import { ArrowUpRight, Code2, Database, Linkedin, Mail, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal } from "../components/reveal";
import { Badge } from "../components/ui/badge";
import { ButtonLink } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  capabilities,
  evidenceStates,
  experience,
  profile,
  projects,
  type EvidenceState,
} from "../content/portfolio";

const repo = (name: string) => `${profile.github}/${name}`;
const eyebrow = "mb-5 font-mono text-xs font-medium tracking-[0.08em] text-accent";
const heading = "max-w-[650px] text-[clamp(32px,4vw,52px)] font-bold leading-[1.08] tracking-[-0.05em]";
const liftOnHover =
  "transition-[transform,box-shadow] duration-300 hover:shadow-[0_18px_40px_#10182812] motion-safe:hover:-translate-y-1";
const inlineLink =
  "inline-flex items-center gap-1.5 font-mono text-[13px] font-medium text-ink transition-colors hover:text-accent";

function External({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function StateBadge({ state }: { state: EvidenceState }) {
  return <Badge tone={state === "Implemented" ? "neutral" : "accent"}>{state}</Badge>;
}

const navItems = [
  ["#work", "Work"],
  ["#experience", "Experience"],
  ["#contact", "Contact"],
] as const;

const contactLinks = [
  { href: `mailto:${profile.email}`, icon: Mail, label: "Email", detail: profile.email, external: false },
  { href: profile.linkedin, icon: Linkedin, label: "LinkedIn", detail: "Connect professionally", external: true },
  { href: profile.github, icon: Code2, label: "GitHub", detail: "Explore public work", external: true },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
      <header>
        <nav aria-label="Primary" className="flex h-[88px] items-center justify-between border-b border-line">
          <a
            href="#top"
            aria-label="Lucas Rangel, back to top"
            className="grid size-[38px] place-items-center rounded-xl bg-ink font-mono text-[13px] font-medium text-white"
          >
            LR
          </a>
          <ul className="flex gap-4 text-sm text-muted sm:gap-6">
            {navItems.map(([href, label]) => (
              <li key={href}>
                <a href={href} className="transition-colors hover:text-ink">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        <section
          id="top"
          aria-labelledby="hero-title"
          className="grid max-w-[1060px] items-start gap-8 pb-[72px] pt-[88px] md:grid-cols-[minmax(0,1fr)_310px] md:items-end md:gap-[72px] md:py-28"
        >
          <div>
            <p className={eyebrow}>DATA · ML · AI PLATFORM</p>
            <h1
              id="hero-title"
              className="max-w-[800px] text-[52px] font-extrabold leading-[1.02] tracking-[-0.065em] sm:text-[clamp(48px,7vw,84px)]"
            >
              Systems that hold up when someone asks how they work.
            </h1>
            <p className="my-8 max-w-[680px] text-xl leading-relaxed text-muted">
              {profile.summary} More than twelve years across software, data engineering, machine learning, and
              cloud delivery.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink variant="primary" href="#work">
                View selected work <ArrowUpRight size={17} aria-hidden />
              </ButtonLink>
              <ButtonLink href={profile.github} target="_blank" rel="noreferrer">
                GitHub <Code2 size={17} aria-hidden />
                <span className="sr-only"> (opens in a new tab)</span>
              </ButtonLink>
            </div>
          </div>
          <figure className="m-0 max-w-[360px]">
            {/* Static export serves the file as is; width/height reserve the layout box. */}
            <img
              src="/lucas-rangel.jpg"
              alt="Lucas Rangel at work"
              width={1200}
              height={1800}
              fetchPriority="high"
              className="block aspect-[4/5] h-auto w-full rounded-[20px] object-cover object-[61%_56%] shadow-[0_20px_48px_#10182818]"
            />
            <figcaption className="mt-3 font-mono text-xs leading-normal text-muted">
              Building reliable systems, from data foundations to AI delivery.
            </figcaption>
          </figure>
        </section>

        <section id="work" aria-labelledby="work-title" className="py-[72px] md:py-28">
          <Reveal>
            <p className={eyebrow}>SELECTED WORK</p>
            <h2 id="work-title" className={heading}>
              Public evidence, not a tool list.
            </h2>
            <dl className="mt-8 grid max-w-[900px] gap-4 text-sm text-muted md:grid-cols-3">
              {(Object.keys(evidenceStates) as EvidenceState[]).map((state) => (
                <div key={state} className="grid content-start gap-2">
                  <dt>
                    <StateBadge state={state} />
                  </dt>
                  <dd className="m-0 leading-relaxed">{evidenceStates[state]}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <li key={project.slug} className="flex">
                <Card className={`flex w-full flex-col p-6 ${liftOnHover}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-medium text-accent">0{index + 1}</span>
                    <StateBadge state={project.state} />
                  </div>
                  <h3 className="mb-2 mt-10 text-xl font-bold">{project.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{project.summary}</p>
                  {project.evidence && (
                    <p className="mt-4 border-t border-line pt-4 text-[13px] leading-relaxed">{project.evidence}</p>
                  )}
                  {project.limits && <p className="mt-2 text-[13px] leading-relaxed text-muted">{project.limits}</p>}
                  <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-6">
                    <External href={repo(project.slug)} className={`${inlineLink} break-all`}>
                      <Code2 size={15} aria-hidden className="flex-none" /> {project.slug}
                      <ArrowUpRight size={15} aria-hidden className="flex-none" />
                    </External>
                    {project.links?.map((link) => (
                      <External key={link.href} href={link.href} className={inlineLink}>
                        <Database size={15} aria-hidden className="flex-none" /> {link.label}
                        <ArrowUpRight size={15} aria-hidden className="flex-none" />
                      </External>
                    ))}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="capabilities"
          aria-labelledby="capabilities-title"
          className="border-t border-line py-[72px] md:py-28"
        >
          <Reveal>
            <p className={eyebrow}>CAPABILITIES</p>
            <h2 id="capabilities-title" className={heading}>
              Each capability points to a public repository.
            </h2>
            <ul className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {capabilities.map((capability) => (
                <li key={capability.title} className="border-t border-ink pt-5">
                  <h3 className="text-[17px] font-bold">{capability.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{capability.detail}</p>
                  <ul className="mt-4 grid gap-1.5">
                    {capability.repos.map((slug) => (
                      <li key={slug}>
                        <External href={repo(slug)} className="break-all font-mono text-xs text-accent-ink hover:underline">
                          {slug}
                        </External>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section
          id="experience"
          aria-labelledby="experience-title"
          className="grid gap-8 border-t border-line py-[72px] md:grid-cols-2 md:gap-20 md:py-28"
        >
          <Reveal>
            <p className={eyebrow}>EXPERIENCE</p>
            <h2 id="experience-title" className={heading}>
              From software foundations to data and AI platforms.
            </h2>
          </Reveal>
          <Reveal>
            <ol className="m-0 list-none p-0">
              {experience.map(([period, title, detail]) => (
                <li key={period} className="border-b border-line py-5">
                  <p className="mb-2 font-mono text-xs font-medium text-accent">{period}</p>
                  <h3 className="mb-1 text-[17px] font-bold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{detail}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        <section aria-labelledby="principles-title" className="border-t border-line py-[72px] md:py-28">
          <Reveal className="flex max-w-[850px] flex-col gap-6 sm:flex-row">
            <ShieldCheck size={26} className="flex-none text-accent" aria-hidden />
            <div>
              <p className={eyebrow}>WORKING PRINCIPLES</p>
              <h2 id="principles-title" className={heading}>
                Clear contracts. Measured behavior. Public boundaries.
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-muted">
                I use reproducible data releases, explicit evaluation, infrastructure-as-code, and documented limits to
                make technical work reviewable.
              </p>
            </div>
          </Reveal>
        </section>

        <section id="contact" aria-labelledby="contact-title" className="border-t border-line py-[72px] md:py-28">
          <Reveal>
            <p className={eyebrow}>CONTACT</p>
            <h2 id="contact-title" className={heading}>
              Open to thoughtful technical conversations.
            </h2>
            <ul className="mt-12 grid gap-4 md:grid-cols-3">
              {contactLinks.map(({ href, icon: Icon, label, detail, external }) => {
                const body = (
                  <>
                    <Icon size={20} className="flex-none text-accent" aria-hidden />
                    <span className="grid flex-1 gap-1 text-[13px] text-muted">
                      <strong className="text-sm text-ink">{label}</strong>
                      <span className="break-all">{detail}</span>
                    </span>
                    <ArrowUpRight size={18} className="flex-none" aria-hidden />
                  </>
                );
                const className = `flex min-h-24 w-full items-center gap-3.5 rounded-2xl border border-line bg-white p-5 ${liftOnHover}`;
                return (
                  <li key={label} className="flex">
                    {external ? (
                      <External href={href} className={className}>
                        {body}
                      </External>
                    ) : (
                      <a href={href} className={className}>
                        {body}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </section>
      </main>

      <footer className="flex flex-col items-start justify-between gap-4 border-t border-line py-8 text-sm sm:flex-row sm:items-center">
        <div className="grid gap-1">
          <strong>{profile.name}</strong>
          <span className="text-muted">{profile.role}</span>
        </div>
        <a href={`mailto:${profile.email}`} className="flex items-center gap-2 font-bold">
          Start a conversation <Mail size={17} aria-hidden />
        </a>
      </footer>
    </div>
  );
}
