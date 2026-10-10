import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "JengaPact — Build without the uncertainty",
    template: "%s · JengaPact",
  },
  description:
    "Kenya-first construction agreement, transparency and trust platform. From negotiation to final payment, every decision is recorded, attributable and reviewable.",
  applicationName: "JengaPact",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-KE">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
