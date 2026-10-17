import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Dashboards | Lucas Rangel" };

export default function DashboardsIndex() {
  redirect("/dashboards/pncp/");
}
