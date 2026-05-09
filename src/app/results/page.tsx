import type { Metadata } from "next";
import { ResultsAtlasPage } from "@/components/AtlasPages";

export const metadata: Metadata = {
  title: "Your Matched Resources — Startup Compass",
  description: "Utah startup resources matched to your stage, sector, and goals.",
};

export default function ResultsPage() {
  return <ResultsAtlasPage />;
}
