import type { Metadata } from "next";
import "./globals.css";
import DemoDataBanner from "@/components/DemoDataBanner";

export const metadata: Metadata = {
  title: "ACADSHIELD X — Digital Trust Infrastructure for Education & Employment",
  description: "Institution-reviewed academic source records, signed credentials, and evidence-based public verification. Blockchain and external source checks are reported when configured.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="theme-color" content="#FAF7F2" />
      </head>
      <body className="bg-canvas-texture min-h-screen text-[#0B251D] antialiased selection:bg-[#E5B25D] selection:text-[#0B251D]">
        <DemoDataBanner />
        {children}
      </body>
    </html>
  );
}
