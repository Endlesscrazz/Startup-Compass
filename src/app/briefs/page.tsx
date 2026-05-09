import type { Metadata } from "next";
import { BriefsHistoryClient } from "./BriefsHistoryClient";

export const metadata: Metadata = {
  title: "Brief history",
};

export default function BriefsPage() {
  return <BriefsHistoryClient />;
}
