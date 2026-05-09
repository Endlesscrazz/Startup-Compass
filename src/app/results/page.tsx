import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ResultsClient } from "./ResultsClient";

export const metadata: Metadata = {
  title: "Your Matched Resources",
  description: "Utah startup resources matched to your stage, sector, and goals.",
};

export default function ResultsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <ResultsClient />
      </main>
      <Footer />
    </>
  );
}
