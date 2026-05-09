import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const SITE_URL = "https://startupcompass.utah.gov";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Startup Compass — Utah's Founder Platform",
    template: "%s · Startup Compass",
  },
  description:
    "The official front door to Utah's startup ecosystem. Find every program, dollar, and mentor the state has to offer — and explore the companies being built here.",
  applicationName: "Startup Compass",
  keywords: [
    "Utah startups",
    "Utah Governor's Office of Economic Development",
    "GOED",
    "startup resources",
    "Utah ecosystem",
    "founder resources",
    "Utah Startup Map",
  ],
  authors: [{ name: "Utah Governor's Office of Economic Development" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Startup Compass",
    title: "Startup Compass — Utah's Founder Platform",
    description:
      "Built in Utah. Found in seconds. The official front door to every program, dollar, and mentor the state has to offer.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Startup Compass — Utah's Founder Platform",
    description:
      "Built in Utah. Found in seconds. The official front door to Utah's startup ecosystem.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0c2856",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-ink">
        <SessionProvider>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
