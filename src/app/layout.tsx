import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
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

const SITE_URL = "https://startupstateatlas.utah.gov";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Startup State Atlas",
    template: "%s · Startup State Atlas",
  },
  description:
    "The official dealflow and founder-discovery layer for Utah. Explore startups, investors, resources, and founder matches.",
  applicationName: "Startup State Atlas",
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
    siteName: "Startup State Atlas",
    title: "Startup State Atlas",
    description:
      "The official dealflow and founder-discovery layer for Utah.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Startup State Atlas",
    description:
      "Invest in what Utah is building with verified startup, investor, and founder-resource intelligence.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1b33",
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
        {children}
      </body>
    </html>
  );
}
