"use client";

import { useState } from "react";

type ReindexResult = {
  ok: boolean;
  count?: number;
  dim?: number;
  reloadedIn?: string;
  error?: string;
};

export function AdminClient() {
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<ReindexResult | null>(null);

  async function handleReindex() {
    if (!secret.trim()) return;
    setStatus("loading");
    setResult(null);
    try {
      const res = await fetch("/api/admin/reindex", {
        method: "POST",
        headers: { Authorization: secret.trim() },
      });
      const data: ReindexResult = await res.json();
      setResult(data);
      setStatus(res.ok ? "done" : "error");
    } catch {
      setResult({ ok: false, error: "Network error — is the server running?" });
      setStatus("error");
    }
  }

  return (
    <div className="atlas-page atlas-page-light" style={{ minHeight: "100dvh" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "4rem 1.5rem" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "#4a6080", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          Admin
        </p>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#062a52", marginBottom: "0.5rem" }}>
          Resource index
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#4a6080", marginBottom: "2rem", lineHeight: 1.6 }}>
          After updating <code style={{ background: "#e8eef6", padding: "1px 5px", borderRadius: 4 }}>data/resources.json</code> and regenerating{" "}
          <code style={{ background: "#e8eef6", padding: "1px 5px", borderRadius: 4 }}>data/embeddings.json</code>, click{" "}
          <strong>Reload index</strong> to hot-swap the in-memory index without a server restart.
        </p>

        {/* How to add resources */}
        <div style={{ background: "rgba(8,38,83,0.04)", border: "1px solid rgba(8,38,83,0.1)", borderRadius: 12, padding: "1.25rem", marginBottom: "2rem" }}>
          <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#062a52", marginBottom: "0.5rem" }}>
            How to add or update resources
          </p>
          <ol style={{ paddingLeft: "1.2rem", fontSize: "0.8rem", color: "#4a6080", lineHeight: 1.8, margin: 0 }}>
            <li>Edit <code style={{ background: "#e8eef6", padding: "1px 4px", borderRadius: 3 }}>data/resources.json</code> — add or modify entries</li>
            <li>Run <code style={{ background: "#e8eef6", padding: "1px 4px", borderRadius: 3 }}>uv run python scripts/generate_embeddings.py</code></li>
            <li>Commit both files and push to redeploy</li>
            <li>Or hit <strong>Reload index</strong> below for an in-memory hot-swap on this instance</li>
          </ol>
        </div>

        {/* Secret input */}
        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#062a52", marginBottom: "0.4rem" }}>
          Admin secret
        </label>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Enter ADMIN_SECRET"
          style={{
            width: "100%",
            padding: "0.65rem 0.9rem",
            borderRadius: 10,
            border: "1px solid rgba(8,38,83,0.18)",
            fontSize: "0.875rem",
            color: "#062a52",
            background: "white",
            marginBottom: "1rem",
            boxSizing: "border-box",
          }}
          onKeyDown={(e) => e.key === "Enter" && handleReindex()}
        />

        {/* Reindex button */}
        <button
          type="button"
          onClick={handleReindex}
          disabled={!secret.trim() || status === "loading"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "0.65rem 1.5rem",
            borderRadius: 8,
            background: !secret.trim() || status === "loading" ? "#c5d0de" : "#062a52",
            color: "white",
            fontWeight: 700,
            fontSize: "0.875rem",
            border: 0,
            cursor: !secret.trim() || status === "loading" ? "not-allowed" : "pointer",
          }}
        >
          {status === "loading" ? "Reloading…" : "↺ Reload index"}
        </button>

        {/* Result */}
        {result && (
          <div style={{
            marginTop: "1.5rem",
            padding: "1rem 1.25rem",
            borderRadius: 10,
            background: result.ok ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
            border: `1px solid ${result.ok ? "rgba(22,163,74,0.25)" : "rgba(220,38,38,0.25)"}`,
            fontSize: "0.875rem",
            color: result.ok ? "#166534" : "#991b1b",
          }}>
            {result.ok ? (
              <>
                <strong>✓ Index reloaded</strong>
                <div style={{ marginTop: 6, fontSize: "0.8rem", opacity: 0.85 }}>
                  {result.count} resources · {result.dim}-dim · {result.reloadedIn}
                </div>
              </>
            ) : (
              <>
                <strong>✗ Failed</strong>
                <div style={{ marginTop: 6, fontSize: "0.8rem" }}>{result.error}</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
