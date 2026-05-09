"use client";

import { Header } from "@/components/Header";
import { InvestorMapExplorer } from "@/components/InvestorMapExplorer";

export default function MapPageClient() {
  return (
    <>
      <Header />
      <InvestorMapExplorer variant="main" />
    </>
  );
}
