import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "../../../components/ui/button";
import { articles } from "../../../content/articles";
import { renderArticle } from "../../../lib/articles";

export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  return article ? { title: `${article.title} | Lucas Rangel`, description: article.summary } : {};
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();
  const { html } = renderArticle(article);
  return (
    <div className="mx-auto max-w-[760px] px-5 sm:px-8">
      <header className="flex h-[88px] items-center border-b border-line">
        <a
          href="/#articles"
          className="inline-flex items-center gap-2 font-mono text-[13px] font-medium text-ink transition-colors hover:text-accent"
        >
          <ArrowLeft size={16} aria-hidden /> Back to portfolio
        </a>
      </header>
      <main id="main" tabIndex={-1} className="py-16 outline-none md:py-24">
        <p className="mb-5 font-mono text-xs font-medium tracking-[0.08em] text-accent">
          TECHNICAL ARTICLE · {article.reading.toUpperCase()}
        </p>
        <h1 className="text-[clamp(32px,5vw,52px)] font-extrabold leading-[1.08] tracking-[-0.05em]">{article.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{article.summary}</p>
        <article className="article-prose mt-12" dangerouslySetInnerHTML={{ __html: html }} />
        <div className="mt-16 border-t border-line pt-8">
          <p className="mb-4 text-sm text-muted">The claims above trace to the versioned repository below.</p>
          <ButtonLink
            variant="primary"
            href={`https://github.com/LucasRangelSSouza/${article.repo}`}
            target="_blank"
            rel="noreferrer"
          >
            Open {article.repo} <ArrowUpRight size={17} aria-hidden />
            <span className="sr-only"> (opens in a new tab)</span>
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
