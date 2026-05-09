import type { Metadata } from "next";
import { EditResourceClient } from "./EditResourceClient";

export const metadata: Metadata = { title: "Edit Resource — Admin" };

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditResourceClient id={parseInt(id, 10)} />;
}
