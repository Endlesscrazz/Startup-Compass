import type { Metadata } from "next";
import { AdminClient } from "./AdminClient";

export const metadata: Metadata = {
  title: "Admin — Startup Compass",
};

export default function AdminPage() {
  return <AdminClient />;
}
