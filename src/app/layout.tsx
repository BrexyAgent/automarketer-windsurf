import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoMarketer — AI Marketing Platform",
  description: "Multi-tenant AI marketing automation for agencies",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
