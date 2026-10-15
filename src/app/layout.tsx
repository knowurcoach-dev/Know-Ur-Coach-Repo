import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { AppShell } from "@/components/shell/AppShell";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KnowUrCoach - Discover Kids Coaching, Brain Boosters & Sports Across India",
  description: "Discover, compare & book verified kids activity classes, coaching centres, STEM labs, arts and sports academies across India. Free trials and 100% money back escrow protection.",
};

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
