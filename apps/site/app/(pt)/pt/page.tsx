import type { Metadata } from "next";
import { Home } from "../../../components/home";

export const metadata: Metadata = {
  alternates: { canonical: "/pt/", languages: { "x-default": "/", en: "/", "pt-BR": "/pt/" } },
};

export default function Page() {
  return <Home lang="pt" />;
}
