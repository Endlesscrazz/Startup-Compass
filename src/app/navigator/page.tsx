import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NavigatorTabs } from "./NavigatorTabs";

export const metadata: Metadata = {
  title: "Find Your Resources",
  description: "Answer 4 quick questions or describe your situation — get 5–7 Utah startup resources matched to you.",
};

export default function NavigatorPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="border-b border-rule/60 bg-surface-tint/50 px-6 py-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            Find your resources
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-mute">
            5–7 Utah programs matched to your situation · 30 seconds
          </p>
        </div>
        <NavigatorTabs />
      </main>
      <Footer />
    </>
  );
}
