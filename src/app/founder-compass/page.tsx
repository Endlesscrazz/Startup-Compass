import type { Metadata } from "next";
import { FounderCompassPage } from "@/components/AtlasPages";

export const metadata: Metadata = {
  title: "Founder Compass",
  description:
    "Utah founder programs — connect to the embedding-based navigator for personalized matches.",
};

export default function FounderCompassRoute() {
  return <FounderCompassPage />;
}
