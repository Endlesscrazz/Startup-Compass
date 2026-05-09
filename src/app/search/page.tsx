import type { Metadata } from "next";
import { SearchAtlasPage } from "@/components/AtlasPages";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search verified Utah startups and investors in the Startup State Atlas.",
};

export default function SearchRoute() {
  return <SearchAtlasPage />;
}
