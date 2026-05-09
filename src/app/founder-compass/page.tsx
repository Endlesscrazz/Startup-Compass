import type { Metadata } from "next";
import { FounderCompassPage } from "@/components/AtlasPages";

export const metadata: Metadata = {
  title: "Founder Compass",
  description:
    "Personalized Startup State Atlas recommendations for Utah founders.",
};

export default function FounderCompassRoute() {
  return <FounderCompassPage />;
}
