import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Insiders Lab — Agent Platform",
  description: "Autonomous content and growth platform for The Insiders Lab.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
