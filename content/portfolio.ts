/**
 * Public site content. Every statement here must trace to PUBLIC_FACTS.md and
 * pass docs/denied-content.md; tests/content.test.mjs enforces both lists.
 *
 * Each thing has one home: a live demo lives in `demos`, the code behind it in
 * `projects`, paid work in `career` and `engagements`. Other sections link, never repeat.
 */

export const profile = {
  name: "Lucas Rangel Soares de Souza",
  shortName: "Lucas Rangel",
  role: "Senior Data & AI Platform Engineer",
  email: "lucas.rangel@outlook.com",
  github: "https://github.com/LucasRangelSSouza",
  linkedin: "https://www.linkedin.com/in/lucas-rangel-s-souza/",
  kaggle: "https://www.kaggle.com/lucasrangelss",
  summary:
    "I build data platforms and AI systems that teams can inspect, reproduce and operate: lakehouses, ML pipelines, retrieval systems and the models behind them.",
};

/** Counts that a visitor can check from the linked repositories and the Kaggle profile. */
export const stats = [
  { value: "12+", label: "years in software, data and AI" },
  { value: "31", label: "public Kaggle datasets" },
  { value: "428", label: "documented tables in the data map" },
  { value: "18", label: "technical articles" },
] as const;

/** Evidence terms from the portfolio specification, section 0.3. */
export type EvidenceState = "Implemented" | "Locally validated" | "Published dataset" | "Live";

export const evidenceStates: Record<EvidenceState, string> = {
  Live: "Running on a public URL you can open now.",
  "Published dataset": "Released on Kaggle with a SHA-256 manifest per file.",
  "Locally validated": "A dated local command, test or evidence record proves the stated behavior.",
  Implemented: "Code and documentation are public. This alone proves no runtime behavior.",
};

export type Track = "Data platforms" | "ML systems" | "GenAI and retrieval" | "Runtime and delivery";

export type Project = {
  slug: string;
  title: string;
  track: Track;
  summary: string;
  state: EvidenceState;
  evidence?: string;
  limits?: string;
  stack: string[];
  /** Id of the demo in `demos` that runs this code, when there is one. */
  demo?: string;
  links?: { label: string; href: string }[];
};

export type Demo = {
  id: string;
  title: string;
  summary: string;
  cta: string;
  href: string;
  /** Repository slug in `projects` whose code runs this demo. */
  project: string;
};

export const demos: Demo[] = [
  {
    id: "rag-chat",
    title: "RAG Chat",
    summary:
      "Ask about Brazilian procurement or education spending. Pick the bases to search. Answers cite the exact records, follow your language, and abstain when the data cannot support a claim.",
    cta: "Open the chat",
    href: "https://rag.rangeltech.net",
    project: "rag-chat",
  },
  {
    id: "pncp",
    title: "Procurement explorer",
    summary:
      "Every PNCP notice in one Postgres: search by words, search by meaning with pgvector, and read the aggregate dashboard beside it.",
    cta: "Search notices",
    href: "/dashboards/pncp/",
    project: "brazil-public-data-map",
  },
  {
    id: "siope",
    title: "Education spending",
    summary:
      "Municipal education investment per student by year, region and state, read straight from the published tables.",
    cta: "Open the dashboard",
    href: "/dashboards/siope/",
    project: "brazil-public-data-map",
  },
  {
    id: "datamap",
    title: "Data map",
    summary:
      "Every table and column of the 31 public datasets, with source, lineage and join keys, searchable in the browser.",
    cta: "Browse the map",
    href: "/datamap/",
    project: "brazil-public-data-map",
  },
];

export const projects: Project[] = [
  {
    slug: "brazil-public-data-map",
    title: "Brazil public data map",
    track: "Data platforms",
    summary:
      "Eleven Brazilian public sources, from the school census to procurement, released as raw, trusted and analytics layers with contracts, a privacy gate and per-file hashes.",
    state: "Published dataset",
    evidence:
      "31 Kaggle datasets, 428 tables and about 4 billion rows of Parquet. Every file is listed in a SHA-256 manifest, and a clean download is verified against it.",
    stack: ["BigQuery", "Parquet", "Python", "Kaggle API"],
    demo: "datamap",
    links: [{ label: "Kaggle datasets", href: "https://www.kaggle.com/lucasrangelss/datasets" }],
  },
  {
    slug: "cloud-data-finops-sdd-toolkit",
    title: "Data FinOps toolkit",
    track: "Data platforms",
    summary: "A specification-driven cost assessment that turns a narrow metadata access boundary into auditable findings, a report and a deck.",
    state: "Implemented",
    stack: ["Python", "BigQuery", "AWS", "SDD"],
  },
  {
    slug: "education-finance-mlops",
    title: "Education finance MLOps",
    track: "ML systems",
    summary: "Municipality-level anomaly triage on public education spending, with lineage and a drift gate that refuses to score a shifted batch.",
    state: "Locally validated",
    evidence:
      "v0.2.0 scored the 2022 batch with 96 review signals; the drift gate blocked the 2023 batch at a spread ratio of 1.384.",
    limits: "Outputs are review signals. There are no labels, so no accuracy is claimed.",
    stack: ["Python", "scikit-learn", "MLflow"],
  },
  {
    slug: "pncp-opportunity-recommender",
    title: "Procurement ranking",
    track: "ML systems",
    summary: "Transparent retrieval and ranking of historical procurement notices, with every score explained.",
    state: "Locally validated",
    evidence: "v0.2.0 ranks notices from the pinned PNCP release and verifies its hash before use.",
    limits: "Offline evaluation uses synthetic profiles, so it measures constraint adherence, not user relevance.",
    stack: ["Python", "BM25", "Evaluation"],
  },
  {
    slug: "rag-chat",
    title: "RAG Chat",
    track: "GenAI and retrieval",
    summary:
      "A cited research chat over three public bases: text and vector retrieval for notices, read-only SQL for contracts and spending, and gates that run before any model call.",
    state: "Live",
    evidence: "1,250,335 notice embeddings in pgvector. The 2026-10-01 browser session answered 10 of 10 scripted questions.",
    limits: "Numeric questions across all bases can still fall back to text retrieval; a question router is in progress.",
    stack: ["Next.js", "FastAPI", "Postgres", "pgvector"],
    demo: "rag-chat",
  },
  {
    slug: "qwen-abliterated-api",
    title: "Self-hosted LLM serving",
    track: "GenAI and retrieval",
    summary: "The 27B Qwen model behind the chat, served from one rented GPU through an OpenAI-compatible API.",
    state: "Live",
    evidence: "NVFP4 weights on vLLM with speculative decoding: from 4.4 to about 34 tokens per second on the same GPU.",
    limits: "The abliterated checkpoint is a third-party release; I did not retrain it.",
    stack: ["vLLM", "Terraform", "GitHub Actions"],
  },
  {
    slug: "ai-platform-rag-observability",
    title: "Observable RAG",
    track: "GenAI and retrieval",
    summary: "A retrieval reference with evaluation, source citations and redacted traces.",
    state: "Implemented",
    stack: ["Python", "Langfuse", "Docker"],
  },
  {
    slug: "distributed-agent-runtime-lab",
    title: "Distributed agent runtime",
    track: "Runtime and delivery",
    summary: "Redis-coordinated workers with idempotent requests, Kubernetes manifests, Terraform and recovery tests.",
    state: "Locally validated",
    evidence: "48 requests at concurrency 6: 61.89 req/s, p95 147.95 ms. Worker recovery proven on a local kind cluster.",
    limits: "Deterministic model stub on one host; not a capacity claim. Cloud not validated.",
    stack: ["Redis", "Kubernetes", "Helm", "Terraform"],
  },
];

export const tracks: Track[] = ["Data platforms", "ML systems", "GenAI and retrieval", "Runtime and delivery"];

export type Role = {
  company: string;
  start: string;
  end: string | null;
  area: string;
  sector: string;
  highlights: string[];
  stack: string[];
};

/** Employment history from the resume, newest first. */
export const career: Role[] = [
  {
    company: "Drogasil",
    start: "2024-12",
    end: null,
    area: "Data and AI engineering",
    sector: "Retail",
    highlights: [
      "ELT pipelines with dbt and PySpark, and data prepared for AI applications.",
      "Golden ID, deduplication, governance and AI-assisted cataloguing.",
      "LLM, RAG and vector-database solutions, with GitLab CI/CD for data, models and agents.",
    ],
    stack: ["dbt", "PySpark", "Airflow", "GitLab CI", "LLM", "RAG"],
  },
  {
    company: "Bradesco",
    start: "2023-12",
    end: "2024-12",
    area: "Data engineering and ML",
    sector: "Banking",
    highlights: [
      "ETL/ELT flows and ML pipelines on Databricks.",
      "Jobs, clusters and models monitored with MLflow.",
      "Data and models versioned with Delta Lake, Unity Catalog and Feature Store.",
    ],
    stack: ["Databricks", "PySpark", "MLflow", "Delta Lake"],
  },
  {
    company: "SCPC",
    start: "2022-10",
    end: "2023-12",
    area: "Data engineering and ML",
    sector: "Credit bureau",
    highlights: [
      "Data and ML pipelines on Google Cloud with Composer and Dataproc.",
      "Pipelines in Java, Python, Spark and Vertex AI.",
      "GitLab CI/CD over BigQuery, Bigtable, Dataflow and Cloud Storage.",
    ],
    stack: ["GCP", "Vertex AI", "Dataproc", "BigQuery"],
  },
  {
    company: "Cielo",
    start: "2021-12",
    end: "2022-09",
    area: "Data engineering and big data",
    sector: "Payments",
    highlights: [
      "Cloudera routines with Hadoop, Hive and Spark; Oracle extraction with Sqoop.",
      "Data warehouse modelling.",
      "AWS S3, Glue, Athena and SageMaker alongside the on-premises cluster.",
    ],
    stack: ["Hadoop", "Spark", "Hive", "AWS"],
  },
  {
    company: "Drogaria São Paulo",
    start: "2021-03",
    end: "2021-11",
    area: "Data engineering",
    sector: "Retail",
    highlights: [
      "Built a data lake on Google Cloud from Qlik QVD extracts.",
      "Composer/Airflow orchestration over Cloud Storage and BigQuery.",
    ],
    stack: ["GCP", "Airflow", "BigQuery"],
  },
  {
    company: "Sem Parar",
    start: "2019-11",
    end: "2021-02",
    area: "Data engineering",
    sector: "Mobility payments",
    highlights: [
      "Migrated relational databases to a data lake on AWS.",
      "SSIS flows over SQL Server and Oracle; Salesforce and CRM integration.",
    ],
    stack: ["AWS", "SSIS", "SQL Server", "Oracle"],
  },
  {
    company: "Smarttbot",
    start: "2019-06",
    end: "2019-10",
    area: "Full-stack and cloud",
    sector: "Fintech",
    highlights: ["Python and Node.js backends, React frontends, Redis and MySQL, all containerised on AWS."],
    stack: ["Python", "Node.js", "React", "Docker"],
  },
  {
    company: "Cogna Educação",
    start: "2017-02",
    end: "2019-05",
    area: "Data engineering and project coordination",
    sector: "Education",
    highlights: [
      "Extraction from SAP HANA and MongoDB, Spark routines and data warehouse modelling.",
      "Pipelines on Azure DevOps, Spark and Airflow; data governance and project coordination.",
    ],
    stack: ["Spark", "Airflow", "Azure DevOps", "SAP HANA"],
  },
  {
    company: "TOTVS",
    start: "2016-01",
    end: "2017-01",
    area: "Software and databases",
    sector: "Enterprise software",
    highlights: ["Delphi development, Oracle server administration and PL/SQL routines."],
    stack: ["Delphi", "Oracle", "PL/SQL"],
  },
  {
    company: "SENAI Institute of Technology",
    start: "2014-06",
    end: "2015-12",
    area: "Software and databases",
    sector: "Industrial automation",
    highlights: ["Python, Java, C++ for embedded chips, web and mobile apps, MQTT messaging and five database engines."],
    stack: ["Java", "C++", "Python", "MQTT"],
  },
];

/** Recent project work, described by sector and stack only: no client names and no client metrics. */
export const engagements = [
  {
    sector: "Grocery e-commerce",
    problem: "Product recommendations for a European online grocer, chosen in two stages: first the category, then the brand and pack size.",
    stack: ["AWS Glue", "SageMaker Pipelines", "DeepFM", "DIN", "Terraform"],
  },
  {
    sector: "Entertainment",
    problem: "Concession recommendations for registered and anonymous customers, with an A/B design.",
    stack: ["Azure ML", "Microsoft Fabric", "Azure DevOps"],
  },
  {
    sector: "Finance",
    problem: "A multi-agent assistant whose every number comes from a bronze, silver and gold lake, never from the prompt.",
    stack: ["AWS Glue", "Athena", "SageMaker", "LLM agents"],
  },
  {
    sector: "Mining and bulk materials",
    problem: "Stockpile volume from drone imagery: photogrammetry, ground fitting and point-cloud segmentation in a container job.",
    stack: ["OpenDroneMap", "ECS Fargate", "Open3D", "DBSCAN"],
  },
  {
    sector: "Credit",
    problem: "A self-hosted data lake and risk engine for receivables financing, scoring financial risk and bad faith on separate axes.",
    stack: ["ClickHouse", "MinIO", "Airflow", "Metabase", "FastAPI"],
  },
  {
    sector: "Education",
    problem: "Public-data and product lakes for education companies: raw, trusted and semantic zones, daily orchestration and BI.",
    stack: ["BigQuery", "Airflow", "Metabase", "Power BI"],
  },
  {
    sector: "Legacy modernisation",
    problem: "A specification-driven transpiler that moves COBOL, Delphi and SAS code to Python and Databricks.",
    stack: ["LLM", "SDD", "Databricks"],
  },
] as const;

export const education = [
  "BEng, Mechatronics Engineering, Instituto Federal de Goiás",
  "Technologist, Systems Analysis and Development, UNOPAR",
  "Specialisation, Data Engineering, UNOPAR",
  "Specialisation, Machine Learning and Artificial Intelligence, UNYLEYA",
] as const;
