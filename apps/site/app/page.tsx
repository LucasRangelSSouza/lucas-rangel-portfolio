import { ArrowRight, ArrowUpRight, Code2, Database, GraduationCap, Linkedin, Mail, MessageCircle, PlayCircle } from "lucide-react";
import type { ReactNode } from "react";
import { CareerLineage } from "../components/career-lineage";
import { Reveal } from "../components/reveal";
import { SiteHeader } from "../components/site-header";
import { Badge } from "../components/ui/badge";
import { ButtonLink } from "../components/ui/button";
import { Card } from "../components/ui/card";
import articles from "../content/articles.json";
import {
  career,
  demos,
  education,
  engagements,
  languages,
  profile,
  projects,
  stats,
  tracks,
} from "../content/portfolio";

const repo = (name: string) => `${profile.github}/${name}`;
const eyebrow = "mb-4 font-mono text-xs font-medium tracking-[0.08em] text-accent";
const heading = "max-w-[720px] text-[clamp(32px,4vw,48px)] font-bold leading-[1.08] tracking-[-0.045em]";
const lead = "mt-5 max-w-[680px] text-[17px] leading-relaxed text-muted";
const section = "scroll-mt-20 border-t border-line py-[72px] md:py-24";
const liftOnHover =
  "transition-[transform,box-shadow,border-color] duration-300 hover:border-[#c3cedb] hover:shadow-[0_16px_40px_#1018280f] motion-safe:hover:-translate-y-0.5";
const inlineLink =
  "inline-flex items-center gap-1.5 font-mono text-[13px] font-medium text-ink transition-colors duration-200 hover:text-accent";

const isExternal = (href: string) => /^https?:/.test(href);

function SmartLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return isExternal(href) ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function StateBadge({ state }: { state: string }) {
  return (
    <Badge tone="accent">
      <span aria-hidden className="size-1.5 rounded-full bg-[#16a34a]" /> {state}
    </Badge>
  );
}

const contactLinks = [
  { href: profile.whatsapp, icon: MessageCircle, label: "WhatsApp", detail: "Message me directly" },
  { href: `mailto:${profile.email}`, icon: Mail, label: "Email", detail: profile.email },
  { href: profile.linkedin, icon: Linkedin, label: "LinkedIn", detail: "Connect professionally" },
  { href: profile.github, icon: Code2, label: "GitHub", detail: "Explore the code" },
  { href: profile.kaggle, icon: Database, label: "Kaggle", detail: "Download the datasets" },
];

const featuredArticles = ["A1", "B2", "D1"].map((n) => articles.find((a) => a.number === n)).filter(Boolean) as typeof articles;

export default function Home() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
      <SiteHeader />

      <main id="main" tabIndex={-1} className="outline-none">
        {/* Hero */}
        <section
          id="top"
          aria-labelledby="hero-title"
          className="grid items-end gap-10 pb-16 pt-16 md:grid-cols-[minmax(0,1fr)_300px] md:gap-16 md:pb-24 md:pt-24"
        >
          <div>
            <p className={eyebrow}>DATA · ML · AI PLATFORM</p>
            <h1
              id="hero-title"
              className="max-w-[780px] text-[44px] font-extrabold leading-[1.02] tracking-[-0.06em] sm:text-[clamp(48px,6.4vw,76px)]"
            >
              Systems that hold up when someone asks how they work.
            </h1>
            <p className="mt-7 max-w-[640px] text-lg leading-relaxed text-muted sm:text-xl">{profile.summary}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink variant="primary" href="#demos">
                Try the live demos <PlayCircle size={17} aria-hidden />
              </ButtonLink>
              <ButtonLink href="#career">
                See the career <ArrowRight size={17} aria-hidden />
              </ButtonLink>
            </div>
          </div>
          <figure className="m-0 max-w-[300px]">
            {/* Static export serves the file as is; width/height reserve the layout box. */}
            <img
              src="/lucas-rangel.jpg"
              alt="Lucas Rangel at work"
              width={1200}
              height={1800}
              fetchPriority="high"
              className="block aspect-[4/5] h-auto w-full rounded-[20px] object-cover object-[61%_56%] shadow-[0_20px_48px_#10182814]"
            />
            <figcaption className="mt-3 text-[13px] leading-normal text-muted">
              <strong className="font-bold text-ink">{profile.name}</strong>
              <br />
              {profile.role}
            </figcaption>
          </figure>
        </section>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white px-6 py-6">
              <dt className="text-[13px] leading-snug text-muted">{stat.label}</dt>
              <dd className="m-0 mt-2 text-[34px] font-bold leading-none tracking-[-0.04em]">{stat.value}</dd>
            </div>
          ))}
        </dl>

        {/* Live demos: one card per running service. */}
        <section id="demos" aria-labelledby="demos-title" className={`${section} mt-[72px] md:mt-24`}>
          <Reveal>
            <p className={eyebrow}>TRY IT</p>
            <h2 id="demos-title" className={heading}>
              Live demos you can open, test and question.
            </h2>
            <p className={lead}>
              Each demo covers one area teams hire for, from generative AI to data governance, running on the public
              Brazilian datasets published on Kaggle. They describe what the records say; they are not legal advice or a
              supplier recommendation.
            </p>
          </Reveal>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {demos.map((demo) => (
              <li key={demo.id} className="flex">
                <Card className={`relative flex w-full flex-col p-6 ${liftOnHover}`}>
                  <Badge tone="accent" className="self-start">
                    <span aria-hidden className="size-1.5 rounded-full bg-[#16a34a]" /> Live
                  </Badge>
                  <p className="mt-8 font-mono text-[12px] font-medium uppercase leading-snug tracking-[0.06em] text-accent">
                    {demo.area}
                  </p>
                  <h3 className="mb-2 mt-2 text-xl font-bold">
                    <SmartLink href={demo.href} className="after:absolute after:inset-0 after:rounded-[20px]">
                      {demo.title}
                    </SmartLink>
                  </h3>
                  <p className="text-[15px] leading-relaxed text-muted">{demo.summary}</p>
                  <p className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-bold">
                    {demo.cta} {isExternal(demo.href) ? <ArrowUpRight size={16} aria-hidden /> : <ArrowRight size={16} aria-hidden />}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {/* Open-source work, grouped by track. */}
        <section id="work" aria-labelledby="work-title" className={section}>
          <Reveal>
            <p className={eyebrow}>OPEN SOURCE</p>
            <h2 id="work-title" className={heading}>
              The code behind every demo and research project.
            </h2>
            <p className={lead}>
              Every demo and research project above, grouped by track, with its repository, published data and stack.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-14">
            {tracks.map((track) => (
              <div key={track} className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
                <h3 className="font-mono text-[13px] font-medium tracking-[0.06em] text-muted lg:pt-6">{track.toUpperCase()}</h3>
                <ul className="grid gap-4 md:grid-cols-2">
                  {projects
                    .filter((project) => project.track === track)
                    .map((project) => {
                      const demo = demos.find((d) => d.id === project.demo);
                      return (
                        <li key={project.slug} className="flex">
                          <Card className={`flex w-full flex-col p-6 ${liftOnHover}`}>
                            <div className="flex items-center justify-between gap-3">
                              <StateBadge state={project.state} />
                              {demo ? (
                                <SmartLink href={demo.href} className={inlineLink}>
                                  <PlayCircle size={15} aria-hidden /> Demo
                                </SmartLink>
                              ) : null}
                            </div>
                            <h4 className="mb-2 mt-6 text-xl font-bold">{project.title}</h4>
                            <p className="text-[15px] leading-relaxed text-muted">{project.summary}</p>
                            {project.evidence && (
                              <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed">{project.evidence}</p>
                            )}
                            {project.limits && <p className="mt-2 text-sm leading-relaxed text-muted">{project.limits}</p>}
                            <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Stack">
                              {project.stack.map((tool) => (
                                <li key={tool} className="rounded-full bg-paper px-2.5 py-1 font-mono text-[12px] text-muted">
                                  {tool}
                                </li>
                              ))}
                            </ul>
                            <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-6">
                              <SmartLink href={repo(project.slug)} className={`${inlineLink} break-all`}>
                                <Code2 size={15} aria-hidden className="flex-none" /> {project.slug}
                                <ArrowUpRight size={15} aria-hidden className="flex-none" />
                              </SmartLink>
                              {project.links?.map((link) => (
                                <SmartLink key={link.href} href={link.href} className={inlineLink}>
                                  <Database size={15} aria-hidden className="flex-none" /> {link.label}
                                  <ArrowUpRight size={15} aria-hidden className="flex-none" />
                                </SmartLink>
                              ))}
                            </div>
                          </Card>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Career: employers from the resume, then recent project work without client names. */}
        <section id="career" aria-labelledby="career-title" className={section}>
          <Reveal>
            <p className={eyebrow}>CAREER</p>
            <h2 id="career-title" className={heading}>
              Twelve years, from embedded software to AI platforms.
            </h2>
            <p className={lead}>
              Ten employers across retail, banking, payments, credit and education. Select one to see what I did there.
            </p>
          </Reveal>
          <div className="mt-12">
            <CareerLineage roles={career} />
          </div>

          <div className="mt-20 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
            <div>
              <h3 className="font-mono text-[13px] font-medium tracking-[0.06em] text-muted">RECENT PROJECT WORK</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Client work is described by sector and stack only. Each linked card opens a write-up of the case on synthetic data.
              </p>
            </div>
            <ul className="grid gap-4 md:grid-cols-2">
              {engagements.map((item) => (
                <li key={item.sector} className="flex">
                  {item.article ? (
                    <a
                      href={`/articles/${item.article}/`}
                      className={`group flex w-full flex-col rounded-[20px] border border-line bg-white p-6 ${liftOnHover}`}
                    >
                      <p className="font-mono text-xs font-medium tracking-[0.06em] text-accent">{item.sector.toUpperCase()}</p>
                      <p className="mt-3 text-[15px] leading-relaxed">{item.problem}</p>
                      <p className="mt-4 font-mono text-[12px] leading-relaxed text-muted">{item.stack.join(" · ")}</p>
                      <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13px] font-semibold text-accent">
                        Read the case <ArrowRight size={15} aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5" />
                      </span>
                    </a>
                  ) : (
                    <div className="flex w-full flex-col rounded-[20px] border border-line bg-white p-6">
                      <p className="font-mono text-xs font-medium tracking-[0.06em] text-accent">{item.sector.toUpperCase()}</p>
                      <p className="mt-3 text-[15px] leading-relaxed">{item.problem}</p>
                      <p className="mt-4 font-mono text-[12px] leading-relaxed text-muted">{item.stack.join(" · ")}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-16 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
            <div>
              <h3 className="font-mono text-[13px] font-medium tracking-[0.06em] text-muted">EDUCATION</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Engineering first, then software, then data and AI: each degree matches a step in the career above.
              </p>
              <ul className="mt-6 grid gap-2 text-sm" aria-label="Languages">
                {languages.map((item) => (
                  <li key={item.name} className="flex items-center justify-between gap-3 border-t border-line pt-2">
                    <span className="font-bold">{item.name}</span>
                    <span className="text-muted">{item.level}</span>
                  </li>
                ))}
              </ul>
            </div>
            <ol className="grid list-none gap-4 p-0 md:grid-cols-2">
              {education.map((degree) => (
                <li key={degree.title} className="flex flex-col rounded-[20px] border border-line bg-white p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-[#eef4ff] text-accent">
                      <GraduationCap size={20} aria-hidden />
                    </span>
                    <p className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-accent">{degree.level}</p>
                  </div>
                  <h4 className="mt-5 text-xl font-bold leading-snug">{degree.title}</h4>
                  <p className="mt-1 text-[15px] text-muted">{degree.school}</p>
                  <p className="mt-4 border-t border-line pt-4 text-[15px] leading-relaxed">{degree.focus}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Writing */}
        <section id="articles" aria-labelledby="articles-title" className={section}>
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className={eyebrow}>WRITING</p>
              <h2 id="articles-title" className={heading}>
                Engineering notes, with the numbers and the limits.
              </h2>
            </div>
            <ButtonLink href="/articles/">
              All {articles.length} articles <ArrowRight size={17} aria-hidden />
            </ButtonLink>
          </Reveal>
          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {featuredArticles.map((article) => (
              <li key={article.slug} className="flex">
                <Card className={`relative flex w-full flex-col p-6 ${liftOnHover}`}>
                  <p className="font-mono text-xs font-medium text-accent">
                    {article.series.toUpperCase()} · {article.readMinutes} MIN
                  </p>
                  <h3 className="mb-3 mt-6 text-xl font-bold leading-snug">
                    <a href={`/articles/${article.slug}/`} className="after:absolute after:inset-0 after:rounded-[20px]">
                      {article.title}
                    </a>
                  </h3>
                  <p className="text-[15px] leading-relaxed text-muted">{article.subtitle}</p>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section id="contact" aria-labelledby="contact-title" className={section}>
          <Reveal>
            <p className={eyebrow}>CONTACT</p>
            <h2 id="contact-title" className={heading}>
              Open to thoughtful technical conversations.
            </h2>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {contactLinks.map(({ href, icon: Icon, label, detail }) => (
                <li key={label} className="flex">
                  <SmartLink
                    href={href}
                    className={`flex min-h-24 w-full items-center gap-3.5 rounded-[20px] border border-line bg-white p-5 ${liftOnHover}`}
                  >
                    <Icon size={20} className="flex-none text-accent" aria-hidden />
                    <span className="grid flex-1 gap-1 text-[13px] text-muted">
                      <strong className="text-[15px] text-ink">{label}</strong>
                      <span className="break-all">{detail}</span>
                    </span>
                    <ArrowUpRight size={18} className="flex-none" aria-hidden />
                  </SmartLink>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      </main>

      <footer className="flex flex-col items-start justify-between gap-4 border-t border-line py-8 text-sm sm:flex-row sm:items-center">
        <div className="grid gap-1">
          <strong>{profile.name}</strong>
          <span className="text-muted">{profile.role}</span>
        </div>
        <SmartLink href={profile.whatsapp} className="flex items-center gap-2 font-bold transition-colors duration-200 hover:text-accent">
          Start a conversation on WhatsApp <MessageCircle size={17} aria-hidden />
        </SmartLink>
      </footer>
    </div>
  );
}
