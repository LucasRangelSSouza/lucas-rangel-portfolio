export type Article = {
  slug: string;
  file: string;
  title: string;
  summary: string;
  repo: string;
  reading: string;
};

/** Technical-disclosure articles. Each cites a versioned repository artefact and states its limits. */
export const articles: Article[] = [
  {
    slug: "rag-chat-versioned-corpus",
    file: "rag-chat-versioned-corpus.md",
    title: "Building a cited RAG chat on a versioned public-data corpus",
    summary: "One rule: cite the exact records used, or say the corpus cannot support an answer. What broke on the first live run, and what the checks showed.",
    repo: "rag-chat",
    reading: "5 min read",
  },
  {
    slug: "finops-access-boundary",
    file: "finops-access-boundary.md",
    title: "From access boundary to FinOps findings",
    summary: "How a specification turns a narrow cloud-metadata access boundary into auditable cost findings, a report, and a deck.",
    repo: "cloud-data-finops-sdd-toolkit",
    reading: "3 min read",
  },
  {
    slug: "education-finance-mlops",
    file: "education-finance-mlops.md",
    title: "A traceable MLOps pipeline for public education-finance indicators",
    summary: "Reproducible anomaly triage with data lineage and a drift gate that stops scoring when the input shifts.",
    repo: "education-finance-mlops",
    reading: "4 min read",
  },
  {
    slug: "procurement-ranking",
    file: "procurement-ranking.md",
    title: "Evaluating a transparent procurement-opportunity ranking system",
    summary: "Explained ranking of historical notices, and why public procurement history is not user propensity.",
    repo: "pncp-opportunity-recommender",
    reading: "5 min read",
  },
  {
    slug: "observable-rag",
    file: "observable-rag.md",
    title: "Observable RAG without unsupported answers",
    summary: "A cited RAG reference that abstains when its corpus cannot support an answer, with redacted traces.",
    repo: "ai-platform-rag-observability",
    reading: "2 min read",
  },
  {
    slug: "idempotency-before-autoscaling",
    file: "idempotency-before-autoscaling.md",
    title: "Idempotency before autoscaling an agent runtime",
    summary: "Idempotent request handling and worker recovery come first; autoscaling claims wait for evidence.",
    repo: "distributed-agent-runtime-lab",
    reading: "3 min read",
  },
];
