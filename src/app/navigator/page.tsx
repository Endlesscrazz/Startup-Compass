import type { Metadata } from "next";
import { NavigatorAtlasPage } from "@/components/AtlasPages";

export const metadata: Metadata = {
  title: "Founder navigator",
  description:
    "30-second intake → POST /api/match — embedding retrieval with Utah county rules.",
};

export default function NavigatorRoute() {
  return <NavigatorAtlasPage />;
}
