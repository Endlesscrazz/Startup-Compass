import type { Metadata } from "next";
import MapPageClient from "./MapPageClient";

export const metadata: Metadata = {
  title: "Utah Startup Map",
  description:
    "Every company being built in Utah, on one interactive map. Filter by sector, stage, and team size — built with the Utah Governor's Office of Economic Development.",
};

export default function MapPage() {
  return <MapPageClient />;
}
