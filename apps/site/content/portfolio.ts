import articleCatalog from "./articles.json";
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
  /** Public WhatsApp contact, approved by Lucas on 2026-10-02. */
  whatsapp: "https://wa.me/5562985613482",
  summary:
    "I build data platforms and AI systems that teams can inspect, reproduce and operate: lakehouses, ML pipelines, retrieval systems and the models behind them.",
};

/** Career totals: employers and consulting clients, projects plus personal and organisation repositories, published articles
 * (the article count follows content/articles.json). */
export const stats = [
  { value: "12+", label: "years building software, data and AI" },
  { value: "150+", label: "projects delivered" },
  { value: String(articleCatalog.length), label: "research and technical articles published" },
  { value: "20+", label: "companies served" },
] as const;

/** Every project is running or published; the badge says so. */
export type EvidenceState = "Live";

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
  /** The area of expertise the demo proves, shown above its title. */
  area: string;
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
    area: "Generative AI · RAG",
    title: "RAG Chat",
    summary:
      "A self-hosted language model with no refusal layer, grounded in knowledge bases: it searches procurement notices, contracts and education spending, writes read-only SQL when the answer is a number, cites every record and keeps the thread of a conversation.",
    cta: "Open the chat",
    href: "https://rag.rangeltech.net",
    project: "rag-chat",
  },
  {
    id: "pncp",
    area: "Vector search · Semantic retrieval",
    title: "Procurement explorer",
    summary:
      "1.25 million procurement notices embedded with a self-hosted model and indexed in pgvector: compare keyword search with search by meaning, side by side, next to the aggregate dashboard.",
    cta: "Search notices",
    href: "/dashboards/pncp/",
    project: "brazil-public-data-map",
  },
  {
    id: "siope",
    area: "BI · Analytics",
    title: "Education spending",
    summary:
      "An analytics dashboard over municipal education spending: investment per student by year, region and state, built on modelled semantic tables.",
    cta: "Open the dashboard",
    href: "/dashboards/siope/",
    project: "brazil-public-data-map",
  },
  {
    id: "datamap",
    area: "Data lake · Catalogue · Governance",
    title: "Data map",
    summary:
      "The catalogue of a public data lake: 428 tables and 33,891 columns from raw to analytics layers, with source, lineage, join keys and the privacy rules applied, searchable in the browser.",
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
    state: "Live",
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
    state: "Live",
    stack: ["Python", "BigQuery", "AWS", "SDD"],
  },
  {
    slug: "education-finance-mlops",
    title: "Education finance MLOps",
    track: "ML systems",
    summary: "Municipality-level anomaly triage on public education spending, with lineage and a drift gate that refuses to score a shifted batch.",
    state: "Live",
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
    state: "Live",
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
    state: "Live",
    stack: ["Python", "Langfuse", "Docker"],
  },
  {
    slug: "distributed-agent-runtime-lab",
    title: "Distributed agent runtime",
    track: "Runtime and delivery",
    summary: "Redis-coordinated workers with idempotent requests, Kubernetes manifests, Terraform and recovery tests.",
    state: "Live",
    evidence: "48 requests at concurrency 6: 61.89 req/s, p95 147.95 ms. Worker recovery proven on a local kind cluster.",
    limits: "Deterministic model stub on one host; not a capacity claim. Cloud not validated.",
    stack: ["Redis", "Kubernetes", "Helm", "Terraform"],
  },
];

export const tracks: Track[] = ["Data platforms", "ML systems", "GenAI and retrieval", "Runtime and delivery"];

export type Role = {
  company: string;
  /** Label for the timeline bar, where the segment is narrow. */
  short: string;
  /** Company logo under public/, shown in the detail card. */
  logo: string;
  summary: string;
  results: string[];
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
    short: "Drogasil",
    logo: "/logos/drogasil.svg",
    summary:
      "Data and AI engineering for one of Brazil's largest pharmacy chains: pipelines, models and AI agents delivered in one engineering flow, with governance and data quality built in.",
    results: ["Pipelines, models and AI agents evolving together in one integrated engineering flow.", "Stronger governance, cataloguing and monitoring of data quality."],
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
    short: "Bradesco",
    logo: "/logos/bradesco.png",
    summary:
      "Data engineering and machine learning on Databricks for one of Brazil's largest banks, keeping data processing and ML pipelines running and versioned.",
    results: ["Sustained data processing and ML pipelines on Databricks.", "Data and model assets organised and versioned with Lakehouse tooling."],
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
    short: "SCPC",
    logo: "/logos/scpc.png",
    summary:
      "Data and ML pipelines on Google Cloud for a credit bureau, from Composer orchestration and Dataproc processing to Vertex AI models.",
    results: ["Data and ML pipelines integrated with the main GCP services.", "Development and deployment cycles automated with CI/CD."],
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
    short: "Cielo",
    logo: "/logos/cielo.png",
    summary:
      "Big data engineering for a payments company: a Cloudera cluster fed from Oracle, data warehouse modelling and AWS services alongside.",
    results: ["Relational data integrated into the Cloudera big data ecosystem.", "Pipelines evolved with Spark processing and AWS data services."],
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
    short: "DSP",
    logo: "/logos/drogaria-sao-paulo.svg",
    summary:
      "Built a data lake on Google Cloud for a pharmacy chain, moving Qlik QVD extracts into Cloud Storage, Composer and BigQuery.",
    results: ["A data lake architecture on Google Cloud.", "QVD data integrated with Cloud Storage, Composer and BigQuery."],
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
    short: "Sem Parar",
    logo: "/logos/sem-parar.svg",
    summary:
      "Data engineering for a mobility payments company: relational databases migrated to a data lake on AWS, with Salesforce and CRM integrated.",
    results: ["Relational databases migrated to a cloud data lake.", "Corporate sources and CRM systems integrated into the data processes."],
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
    short: "STB",
    logo: "/logos/smarttbot.png",
    summary:
      "Full-stack and cloud work for a fintech: Python and Node.js backends, React frontends, Redis and MySQL, all containerised on AWS.",
    results: ["Full-stack applications delivered and kept running on AWS.", "A standard runtime environment through Docker."],
    start: "2019-06",
    end: "2019-10",
    area: "Full-stack and cloud",
    sector: "Fintech",
    highlights: ["Python and Node.js backends, React frontends, Redis and MySQL, all containerised on AWS."],
    stack: ["Python", "Node.js", "React", "Docker"],
  },
  {
    company: "Cogna Educação",
    short: "Cogna",
    logo: "/logos/cogna.svg",
    summary:
      "Data engineering and project coordination for Brazil's largest education group: SAP HANA and MongoDB sources, Spark, Airflow and a data warehouse.",
    results: ["Pipelines and data integrations evolved across big data and cloud environments.", "Stronger data governance and coordination of the technical initiatives."],
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
    short: "TOTVS",
    logo: "/logos/totvs.svg",
    summary:
      "Software and database work at Brazil's largest enterprise software company: Delphi development and Oracle administration.",
    results: ["Development work delivered on the Delphi platform.", "Oracle infrastructure and PL/SQL routines kept running."],
    start: "2016-01",
    end: "2017-01",
    area: "Software and databases",
    sector: "Enterprise software",
    highlights: ["Delphi development, Oracle server administration and PL/SQL routines."],
    stack: ["Delphi", "Oracle", "PL/SQL"],
  },
  {
    company: "SENAI ITA",
    short: "SENAI ITA",
    logo: "/logos/senai.png",
    summary:
      "Software for industrial automation at SENAI's technology institute: embedded C++, web and mobile apps, MQTT messaging and five database engines.",
    results: ["Multiplatform solutions for web, mobile and embedded systems.", "A diverse set of database technologies administered."],
    start: "2014-06",
    end: "2015-12",
    area: "Software and databases",
    sector: "Industrial automation",
    highlights: ["Python, Java, C++ for embedded chips, web and mobile apps, MQTT messaging and five database engines."],
    stack: ["Java", "C++", "Python", "MQTT"],
  },
];

/** Recent project work, described by sector and stack only: no client names and no client metrics. Where a card has
 * an article, it tells the case as a how-to on synthetic data. */
export const engagements: { sector: string; problem: string; stack: string[]; article?: string }[] = [
  {
    sector: "Grocery e-commerce",
    problem: "Product recommendations for a European online grocer, chosen in two stages: first the category, then the brand and pack size.",
    stack: ["AWS Glue", "SageMaker Pipelines", "DeepFM", "DIN", "Terraform"],
    article: "h4-two-stage-recommender-grocery",
  },
  {
    sector: "Entertainment",
    problem: "Concession recommendations for registered and anonymous customers, with an A/B design and production monitoring.",
    stack: ["Azure ML", "Microsoft Fabric", "Azure DevOps"],
    article: "h2-recommender-only-shows-best-sellers",
  },
  {
    sector: "Finance",
    problem: "A multi-agent assistant whose every number comes from a bronze, silver and gold lake, never from the prompt.",
    stack: ["AWS Glue", "Athena", "SageMaker", "LLM agents"],
    article: "h7-stop-agents-inventing-numbers",
  },
  {
    sector: "Mining and bulk materials",
    problem: "Stockpile volume from drone imagery: photogrammetry, ground fitting and point-cloud segmentation in a container job.",
    stack: ["OpenDroneMap", "RANSAC", "HDBSCAN", "AWS Batch"],
    article: "h1-measure-stockpile-volume-drone-photos",
  },
  {
    sector: "Telecom",
    problem: "Will the service backlog hit this month's revenue target? Activation probabilities per order and AI agents that explain them.",
    stack: ["Python", "Monte Carlo", "LLM agents"],
    article: "h8-forecasting-with-ai-agents",
  },
  {
    sector: "Sugar and ethanol",
    problem: "A weekly pricing review where four of five steps became plain code on a medallion lakehouse, and one stayed an LLM.",
    stack: ["BigQuery", "Dataform", "Terraform", "LangGraph"],
    article: "h9-only-one-agent-needs-an-llm",
  },
  {
    sector: "Machinery manufacturing",
    problem: "Interchangeable-part search across plants: extract the critical attributes, filter on them, rank what fits.",
    stack: ["NLP", "Search", "LLM"],
    article: "h5-interchangeable-parts-ai-search",
  },
  {
    sector: "E-commerce accessibility",
    problem: "Daily accessibility scans, a check on every pull request, and a coding agent that opens fixes for human review.",
    stack: ["Playwright", "axe-core", "AWS", "Coding agents"],
    article: "h10-accessibility-fixes-with-ai-agents",
  },
  {
    sector: "Credit",
    problem: "A self-hosted data lake and risk engine for small-business lending, with a probability of default the analysts can read.",
    stack: ["ClickHouse", "MinIO", "Airflow", "Metabase", "FastAPI"],
    article: "h14-predict-loan-default",
  },
  {
    sector: "Textile manufacturing",
    problem: "A data lake on AWS and a weekly demand forecast by product family and colour for production planning.",
    stack: ["AWS Glue", "Terraform", "Gradient boosting"],
    article: "h13-weekly-demand-forecasting",
  },
  {
    sector: "Education",
    problem: "Public-data and product lakes for education companies: raw, trusted and semantic zones, daily orchestration and BI.",
    stack: ["BigQuery", "Airflow", "Metabase", "Power BI"],
    article: "d1-cut-cloud-data-lake-costs",
  },
  {
    sector: "Legacy modernisation",
    problem: "A specification-driven transpiler that moves COBOL, Delphi and SAS code to Python and Databricks.",
    stack: ["LLM", "SDD", "Databricks"],
    article: "h12-migrating-legacy-code-spec-driven",
  },
];

export type Degree = { level: string; title: string; school: string; focus: string };

export const education: Degree[] = [
  {
    level: "Bachelor's degree",
    title: "Mechatronics Engineering",
    school: "Instituto Federal de Goiás (IFG)",
    focus: "Electronics, control systems, embedded programming and industrial automation: the base of the early work in embedded software and automation.",
  },
  {
    level: "Technologist degree",
    title: "Systems Analysis and Development",
    school: "Universidade Norte do Paraná (UNOPAR)",
    focus: "Software engineering, databases, systems analysis and application development.",
  },
  {
    level: "Specialisation",
    title: "Data Engineering",
    school: "Universidade Norte do Paraná (UNOPAR)",
    focus: "Data pipelines, data modelling, warehouses and big data processing.",
  },
  {
    level: "Specialisation",
    title: "Machine Learning and Artificial Intelligence",
    school: "Centro Universitário UNYLEYA",
    focus: "Machine learning models, their evaluation and applied artificial intelligence.",
  },
];

export const languages = [
  { name: "Portuguese", level: "Native" },
  { name: "English", level: "Intermediate" },
] as const;
