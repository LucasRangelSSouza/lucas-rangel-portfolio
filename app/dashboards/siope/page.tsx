import type { Metadata } from "next";
import { DashboardFrame } from "../../../components/dashboard-frame";
import { DashboardShell } from "../../../components/dashboard-shell";
import { dashboards } from "../../../lib/dashboards";

export const metadata: Metadata = {
  title: "SIOPE education spending | Lucas Rangel",
  description: "Municipal and state education budget data from SIOPE, queried with pure SQL.",
};

export default function SiopeDashboard() {
  return (
    <DashboardShell
      kicker="CASE 2 · PURE SQL"
      title="Education spending, answered with SQL, not retrieval"
      lead="SIOPE is numeric and relational, so the chat agent writes read-only SQL against the semantic tables instead of retrieving text. This dashboard reads the same tables."
    >
      <DashboardFrame src={dashboards.siope} title="SIOPE education spending dashboard" />
    </DashboardShell>
  );
}
