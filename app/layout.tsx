import type { Metadata } from "next";
import "./styles.css";
export const metadata: Metadata = { title: "Lucas Rangel | Data & AI Platform Engineer", description: "Selected public work in data platforms, ML systems, and AI infrastructure." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
