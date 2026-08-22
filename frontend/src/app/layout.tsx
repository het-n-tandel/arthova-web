import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "ARTHOVA — Portfolio Management Platform",
  description:
    "A production-grade, real-time portfolio management platform unifying stocks, mutual funds, gold, fixed deposits, and property with ML-driven insights and tax reporting for Indian retail investors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
