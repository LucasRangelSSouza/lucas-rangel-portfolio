import type { Metadata } from "next";
import { DashboardFrame } from "../../../components/dashboard-frame";
import { DashboardShell } from "../../../components/dashboard-shell";
import { dashboards } from "../../../lib/dashboards";

const origin = [
  { label: "brazil-public-data-map", href: "https://github.com/LucasRangelSSouza/brazil-public-data-map", note: "Release contracts, pipelines and the ingestion notebook for the SIOPE open-data API." },
  { label: "rag-chat", href: "https://github.com/LucasRangelSSouza/rag-chat", note: "The chat whose SQL agent reads the same tables." },
  { label: "Data map: SIOPE", href: "/datamap/#/subject/siope", note: "Every table and field of the SIOPE datasets, with lineage and join keys." },
  { label: "Kaggle: SIOPE analytics", href: "https://www.kaggle.com/datasets/lucasrangelss/siope-analytics", note: "The published semantic tables, with a SHA-256 manifest." },
];

export const metadata: Metadata = {
  title: "SIOPE education spending | Lucas Rangel",
  description: "Municipal and state education budget data from SIOPE, queried with pure SQL.",
};

export default function SiopeDashboard() {
  return (
    <DashboardShell
      origin={origin}
      kicker="CASE 2 · PURE SQL"
      title="Education spending, answered with SQL, not retrieval"
      lead="SIOPE is numeric and relational, so the chat agent writes read-only SQL against the semantic tables instead of retrieving text. This dashboard reads the same tables."
    >
      <DashboardFrame src={dashboards.siope} title="SIOPE education spending dashboard" />
    </DashboardShell>
  );
}
