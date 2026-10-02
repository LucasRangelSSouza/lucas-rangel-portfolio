import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "../../../components/ui/button";
import { articles, renderArticle } from "../../../lib/articles";

export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  return article ? { title: `${article.title} | Lucas Rangel`, description: article.subtitle } : {};
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();
  const { html } = renderArticle(article);
  return (
    <div className="mx-auto max-w-[760px] px-5 sm:px-8">
      <header className="flex h-[72px] items-center border-b border-line">
        <a
          href="/articles/"
          className="inline-flex items-center gap-2 font-mono text-[13px] font-medium text-ink transition-colors hover:text-accent"
        >
          <ArrowLeft size={16} aria-hidden /> All articles
        </a>
      </header>
      <main id="main" tabIndex={-1} className="py-16 outline-none md:py-20">
        <p className="mb-5 font-mono text-xs font-medium tracking-[0.08em] text-accent">
          {article.series.toUpperCase()} · {article.readMinutes} MIN READ
        </p>
        <h1 className="text-[clamp(32px,5vw,48px)] font-extrabold leading-[1.08] tracking-[-0.045em]">{article.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{article.subtitle}</p>
        <article className="article-prose mt-12" dangerouslySetInnerHTML={{ __html: html }} />
        <div className="mt-16 flex flex-wrap gap-3 border-t border-line pt-8">
          <ButtonLink href="/articles/">
            <ArrowLeft size={17} aria-hidden /> All articles
          </ButtonLink>
          {article.medium ? (
            <ButtonLink variant="primary" href={article.medium} target="_blank" rel="noreferrer">
              Read on Medium <ArrowUpRight size={17} aria-hidden />
              <span className="sr-only"> (opens in a new tab)</span>
            </ButtonLink>
          ) : null}
        </div>
      </main>
    </div>
  );
}
