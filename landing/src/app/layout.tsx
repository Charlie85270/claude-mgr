import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Echelon - Your AI Agents, Perfectly Managed",
  description: "A Titan's Rift creation. Orchestrate AI agent teams with themed seasons, review gates, and a multi-model counselor. Free and open source.",
  keywords: ["Echelon", "Team Factory Echelon", "Titan's Rift", "Claude", "Codex", "Gemini", "AI", "Agent", "Manager", "Claude Code"],
  icons: { icon: "/dorothy/favicon-32.png", apple: "/dorothy/icon-192.png" },
  openGraph: {
    title: "Echelon - Your AI Agents, Perfectly Managed",
    description: "A beautiful desktop app to manage and orchestrate your AI coding agents. Supports Claude, Codex, and Gemini.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">{children}<Analytics /></body>
    </html>
  );
}
