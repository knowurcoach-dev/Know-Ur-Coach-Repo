import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { AppShell } from "@/components/shell/AppShell";
import { GlobalJsonLd } from "@/components/seo/JsonLd";
import { siteMetadata, siteViewport } from "@/lib/seo-config";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = siteViewport;
export const metadata: Metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <GlobalJsonLd />
      </head>
      <body
        className="antialiased min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col"
        suppressHydrationWarning
      >
        <ClientProviders>
          <AppShell>{children}</AppShell>
        </ClientProviders>
      </body>
    </html>
  );
}
