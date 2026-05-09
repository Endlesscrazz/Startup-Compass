import type { Metadata } from "next";
import { PulsePageClient } from "./PulsePageClient";

export const metadata: Metadata = {
  title: "Utah Startup Pulse — Weekly Ecosystem Digest",
  description:
    "Stay updated on Utah's startup ecosystem. Hiring companies, new startups, funding signals, sector trends, and resources — all in one weekly digest.",
};

export default function PulsePage() {
  return <PulsePageClient />;
}
