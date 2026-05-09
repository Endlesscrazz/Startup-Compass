"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResourceForm } from "@/components/admin/ResourceForm";

interface Props { id: number; }

type ResourceData = {
  id: number; title: string; description: string;
  link: string | null; email: string | null;
  topics: string[]; communities: string[]; industries: string[]; locations: string[];
};

export function EditResourceClient({ id }: Props) {
  const [resource, setResource] = useState<ResourceData | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const secret = sessionStorage.getItem("sc_admin_secret");
    if (!secret) { setError("Admin secret not set — go to /admin first."); setStatus("error"); return; }

    fetch(`/api/admin/resources?id=${id}`, { headers: { Authorization: secret } })
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 401 ? "Wrong secret" : `HTTP ${res.status}`);
        return res.json() as Promise<ResourceData>;
      })
      .then((data) => { setResource(data); setStatus("ready"); })
      .catch((err: Error) => { setError(err.message); setStatus("error"); });
  }, [id]);

  return (
    <div className="atlas-page atlas-page-light" style={{ minHeight: "100dvh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <Link href="/admin" style={{ fontSize: "0.8rem", color: "#4a6080", textDecoration: "none" }}>
          ← Back to admin
        </Link>

        {status === "loading" && <p style={{ marginTop: "2rem", color: "#4a6080" }}>Loading…</p>}

        {status === "error" && (
          <div style={{ marginTop: "2rem", color: "#991b1b", fontSize: "0.875rem" }}>
            Error: {error}
          </div>
        )}

        {status === "ready" && resource && (
          <>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#062a52", margin: "0.75rem 0 0.25rem" }}>
              Edit resource
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#4a6080", marginBottom: "1.75rem" }}>
              {resource.title} <span style={{ color: "#8aa0b8" }}>· id:{resource.id}</span>
            </p>
            <ResourceForm
              mode="edit"
              id={resource.id}
              initial={{
                title: resource.title,
                description: resource.description,
                link: resource.link ?? "",
                email: resource.email ?? "",
                topics: resource.topics,
                communities: resource.communities,
                industries: resource.industries,
                locations: resource.locations,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
