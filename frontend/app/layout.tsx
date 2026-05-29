import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "../components/profile/themes/themes.css";

export const metadata: Metadata = {
  title: "PersonaOn — AI Profile & Chat Builder",
  description:
    "Turn your LinkedIn, resume, and website into a shareable, AI-powered public profile and chat page.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
