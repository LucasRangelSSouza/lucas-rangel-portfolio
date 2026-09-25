/**
 * Public site content. Every statement here must trace to PUBLIC_FACTS.md and
 * pass docs/denied-content.md; tests/content.test.mjs enforces both lists.
 */

export const profile = {
  name: "Lucas Rangel Soares de Souza",
  role: "Senior Data & AI Platform Engineer",
  email: "lucas.rangel@outlook.com",
  github: "https://github.com/LucasRangelSSouza",
  linkedin: "https://www.linkedin.com/in/lucas-rangel-s-souza/",
  summary: "I build data platforms and AI systems that teams can inspect, reproduce, and operate.",
};

/** Evidence terms from the portfolio specification, section 0.3. */
export type EvidenceState = "Implemented" | "Locally validated" | "Published dataset";

export const evidenceStates: Record<EvidenceState, string> = {
  Implemented: "Code and documentation are public. This alone proves no runtime behavior.",
  "Locally validated": "A dated local command, test, or evidence record proves the stated behavior.",
  "Published dataset": "The Kaggle slug and version are recorded in the repository.",
};

export type Project = {
  title: string;
  summary: string;
  slug: string;
  state: EvidenceState;
  evidence?: string;
  limits?: string;
  links?: { label: string; href: string }[];
};

export const kaggleProcurementDataset =
  "https://www.kaggle.com/datasets/lucasrangelss/brazil-pncp-procurement-history";
export const kaggleEducationDataset = "https://www.kaggle.com/datasets/lucasrangelss/brazil-education-data-lake";

export const projects: Project[] = [
  {
    title: "Data FinOps",
    summary: "Specification-driven assessment and evidence-led reporting.",
    slug: "cloud-data-finops-sdd-toolkit",
    state: "Implemented",
  },
  {
    title: "Public data releases",
    summary: "Brazilian education and procurement data contracts for reproducible releases.",
    slug: "brazil-public-data-map",
    state: "Published dataset",
    evidence:
      "Two Kaggle datasets, version 1 each. PNCP procurement history: 1,979 rows per layer, notices from 2025-01-01 to 2025-01-07, modality 6. Education data lake: SIOPE annual municipal declarations 2019-2023 joined to IBGE codes, 27,830 municipality-year rows; a clean download was hash-verified.",
    links: [
      { label: "PNCP dataset", href: kaggleProcurementDataset },
      { label: "Education dataset", href: kaggleEducationDataset },
    ],
  },
  {
    title: "Education MLOps",
    summary: "Traceable municipality-level anomaly triage from public data.",
    slug: "education-finance-mlops",
    state: "Locally validated",
    evidence:
      "v0.2.0 trains a robust peer-group anomaly-triage model on the pinned education Kaggle release. The 2022 batch was scored (96 review signals); the drift gate blocked the 2023 batch (spread ratio 1.384).",
    limits: "Outputs are review signals only. There are no labels, so no accuracy is claimed.",
  },
  {
    title: "Procurement ranking",
    summary: "Transparent retrieval and ranking with responsible matching limits.",
    slug: "pncp-opportunity-recommender",
    state: "Locally validated",
    evidence:
      "v0.2.0 ranks historical notices from the pinned PNCP Kaggle release and verifies its hash before use.",
    limits:
      "Offline evaluation uses synthetic profiles with rule-derived judgments, so it measures constraint adherence, not user relevance.",
  },
  {
    title: "RAG observability",
    summary: "Evaluated retrieval, source citations, and redacted traces.",
    slug: "ai-platform-rag-observability",
    state: "Implemented",
  },
  {
    title: "Distributed runtime",
    summary: "Redis-coordinated workers, Kubernetes, Terraform, and recovery tests.",
    slug: "distributed-agent-runtime-lab",
    state: "Locally validated",
    evidence:
      "Local Compose benchmark on 2026-09-24: 48 requests at concurrency 6, 61.89 req/s, p95 147.95 ms. Worker recovery proven on a local kind cluster.",
    limits:
      "Deterministic model stub on one Docker Desktop host; not a capacity claim. Cloud not validated.",
  },
];

/** Capability groups, each backed only by the public repositories listed with it. */
export const capabilities = [
  {
    title: "Data platforms and releases",
    detail: "Data contracts, reproducible public releases, and cost assessment.",
    repos: ["brazil-public-data-map", "cloud-data-finops-sdd-toolkit"],
  },
  {
    title: "ML systems",
    detail: "Traceable pipelines, offline evaluation, and transparent ranking.",
    repos: ["education-finance-mlops", "pncp-opportunity-recommender"],
  },
  {
    title: "GenAI and RAG",
    detail: "Retrieval evaluation, source citations, and redacted traces.",
    repos: ["ai-platform-rag-observability"],
  },
  {
    title: "Distributed runtime and delivery",
    detail: "Redis coordination, Kubernetes, Terraform, and recovery tests.",
    repos: ["distributed-agent-runtime-lab"],
  },
] as const;

export const experience = [
  ["2024 — present", "Data and AI engineering", "Data pipelines, AI applications, governance, and observability."],
  ["2023 — 2024", "Data and machine learning", "Lakehouse pipelines, MLflow monitoring, and versioned data assets."],
  ["2022 — 2023", "GCP data and ML", "Composer, Dataproc, Vertex AI, and CI/CD for data systems."],
  ["2014 — 2022", "Software, data, and cloud engineering", "Data platforms, full-stack systems, databases, and embedded software."],
] as const;
