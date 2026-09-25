export const profile = {
  name: "Lucas Rangel Soares de Souza",
  role: "Senior Data & AI Platform Engineer",
  email: "lucas.rangel@outlook.com",
  github: "https://github.com/LucasRangelSSouza",
  summary: "I build data platforms and AI systems that teams can inspect, reproduce, and operate.",
};
export const projects = [
  ["Data FinOps", "Specification-driven assessment and evidence-led reporting.", "cloud-data-finops-sdd-toolkit"],
  ["Public data releases", "Brazilian education and procurement data contracts for reproducible releases.", "brazil-public-data-map"],
  ["Education MLOps", "Traceable municipality-level anomaly triage from public data.", "education-finance-mlops"],
  ["Procurement ranking", "Transparent retrieval and ranking with responsible matching limits.", "pncp-opportunity-recommender"],
  ["RAG observability", "Evaluated retrieval, source citations, and redacted traces.", "ai-platform-rag-observability"],
  ["Distributed runtime", "Redis-coordinated workers, Kubernetes, Terraform, and recovery tests.", "distributed-agent-runtime-lab"],
] as const;
export const experience = [
  ["2024 — present", "Data and AI engineering", "Data pipelines, AI applications, governance, and observability."],
  ["2023 — 2024", "Data and machine learning", "Lakehouse pipelines, MLflow monitoring, and versioned data assets."],
  ["2022 — 2023", "GCP data and ML", "Composer, Dataproc, Vertex AI, and CI/CD for data systems."],
  ["2014 — 2022", "Software, data, and cloud engineering", "Data platforms, full-stack systems, databases, and embedded software."],
] as const;
