import type { Metadata } from "next";
import { DashboardFrame } from "../../../components/dashboard-frame";
import { DashboardShell } from "../../../components/dashboard-shell";
import { Explorer } from "../../../components/explorer";
import { dashboards } from "../../../lib/dashboards";

const origin = [
  { label: "brazil-public-data-map", href: "https://github.com/LucasRangelSSouza/brazil-public-data-map", note: "Release contracts, the privacy gate, the pipelines and the ingestion notebook for the PNCP API." },
  { label: "rag-chat", href: "https://github.com/LucasRangelSSouza/rag-chat", note: "The search interface and the retrieval backend used above." },
  { label: "Data map: PNCP", href: "/datamap/#/subject/pncp", note: "Every table and field of the PNCP datasets, with lineage and join keys." },
  { label: "Kaggle: PNCP analytics", href: "https://www.kaggle.com/datasets/lucasrangelss/pncp-analytics", note: "The published semantic tables, with a SHA-256 manifest." },
];

export const metadata: Metadata = {
  title: "PNCP procurement | Lucas Rangel",
  description: "Public procurement notices: text search, semantic vector search and a Metabase dashboard over the same Postgres.",
};

export default function PncpDashboard() {
  return (
    <DashboardShell
      origin={origin}
      kicker="CASE 1 · TEXT + VECTOR SEARCH + SQL"
      title="Brazilian public procurement, searched three ways"
      lead="Every notice published on PNCP up to 2026-07-31, in one Postgres. Search by words, search by meaning with pgvector embeddings, or read the aggregate dashboard below. Values are shown as published."
    >
      <Explorer />
      <section aria-labelledby="pncp-dash">
        <h2 id="pncp-dash" className="mb-4 text-2xl font-bold tracking-[-0.03em]">Aggregate dashboard</h2>
        <DashboardFrame src={dashboards.pncp} title="PNCP procurement dashboard" />
        {dashboards.login ? (
          <p className="mt-4 text-sm text-muted">
            Want to build your own questions? <a className="text-accent-ink underline underline-offset-4" href={dashboards.login} target="_blank" rel="noreferrer">Open the full Metabase<span className="sr-only"> (opens in a new tab)</span></a> with your account.
          </p>
        ) : null}
      </section>
    </DashboardShell>
  );
}
