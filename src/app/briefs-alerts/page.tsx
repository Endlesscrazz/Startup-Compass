import type { Metadata } from "next";
import { BriefsAlertsClient } from "./BriefsAlertsClient";

export const metadata: Metadata = {
  title: "Briefs & alerts",
};

export default function BriefsAlertsPage() {
  return <BriefsAlertsClient />;
}
