"use client";

import Link from "next/link";
import { ResourceForm } from "@/components/admin/ResourceForm";

export function NewResourceClient() {
  return (
    <div className="atlas-page atlas-page-light" style={{ minHeight: "100dvh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <Link href="/admin" style={{ fontSize: "0.8rem", color: "#4a6080", textDecoration: "none" }}>
          ← Back to admin
        </Link>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#062a52", margin: "0.75rem 0 0.25rem" }}>
          Add resource
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#4a6080", marginBottom: "1.75rem" }}>
          The description will be embedded via Gemini — be specific for better matching.
        </p>
        <ResourceForm mode="create" />
      </div>
    </div>
  );
}
