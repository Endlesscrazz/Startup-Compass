import type { Metadata } from "next";
import { SearchAtlasPage } from "@/components/AtlasPages";

export const metadata: Metadata = {
  title: "Investor map",
  description:
    "Explore verified Utah startups on the live map — filters powered by companies.json.",
};

export default function SearchRoute() {
  return <SearchAtlasPage />;
}
