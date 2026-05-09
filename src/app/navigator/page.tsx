import type { Metadata } from "next";
import { NavigatorAtlasPage } from "@/components/AtlasPages";

export const metadata: Metadata = {
  title: "Find Your Resources — Startup Compass",
  description: "Answer 4 quick questions or describe your situation — get 5–7 Utah startup resources matched to you.",
};

export default function NavigatorPage() {
  return <NavigatorAtlasPage />;
}
