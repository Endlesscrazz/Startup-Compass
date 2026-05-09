import type { Metadata } from "next";
import { NewResourceClient } from "./NewResourceClient";

export const metadata: Metadata = { title: "Add Resource — Admin" };

export default function NewResourcePage() {
  return <NewResourceClient />;
}
