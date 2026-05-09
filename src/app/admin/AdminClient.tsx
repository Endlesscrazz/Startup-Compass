"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type ResourceRow = {
  id: number;
  title: string;
  topics: string[];
  locations: string[];
  link: string | null;
  email: string | null;
};

type ReindexResult = { ok: boolean; count?: number; dim?: number; reloadedIn?: string; error?: string };

export function AdminClient() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [secretSaved, setSecretSaved] = useState(false);

  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "error">("idle");
  const [loadError, setLoadError] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const [reindexStatus, setReindexStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [reindexResult, setReindexResult] = useState<ReindexResult | null>(null);

  // Restore secret from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("sc_admin_secret");
    if (saved) { setSecret(saved); setSecretSaved(true); }
  }, []);

  function saveSecret() {
    sessionStorage.setItem("sc_admin_secret", secret.trim());
    setSecretSaved(true);
  }

  const fetchResources = useCallback(async () => {
    const s = sessionStorage.getItem("sc_admin_secret") ?? secret;
    if (!s) return;
    setLoadStatus("loading");
    setLoadError("");
    try {
      const res = await fetch(`/api/admin/resources?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: s },
      });
      if (!res.ok) throw new Error(res.status === 401 ? "Wrong secret" : `HTTP ${res.status}`);
      const data = await res.json();
      setResources(data.resources);
      setTotal(data.total);
      setLoadStatus("idle");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
      setLoadStatus("error");
    }
  }, [q, secret]);

  // Load when secret is saved
  useEffect(() => {
    if (secretSaved) fetchResources();
  }, [secretSaved, fetchResources]);

  async function handleDelete(id: number) {
    const s = sessionStorage.getItem("sc_admin_secret") ?? secret;
    setDeleteStatus("loading");
    try {
      const res = await fetch(`/api/admin/resource/${id}`, {
        method: "DELETE",
        headers: { Authorization: s },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDeleteId(null);
      setDeleteStatus("done");
      fetchResources();
    } catch {
      setDeleteStatus("error");
    }
    setTimeout(() => setDeleteStatus("idle"), 2000);
  }

  async function handleReindex() {
    const s = sessionStorage.getItem("sc_admin_secret") ?? secret;
    setReindexStatus("loading");
    setReindexResult(null);
    try {
      const res = await fetch("/api/admin/reindex", {
        method: "POST",
        headers: { Authorization: s },
      });
      const data: ReindexResult = await res.json();
      setReindexResult(data);
      setReindexStatus(res.ok ? "done" : "error");
    } catch {
      setReindexResult({ ok: false, error: "Network error" });
      setReindexStatus("error");
    }
  }

  const s = (style: React.CSSProperties) => style;

  return (
    <div className="atlas-page atlas-page-light" style={{ minHeight: "100dvh" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* Header */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "#4a6080", textTransform: "uppercase" }}>
          Admin Console
        </p>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#062a52", marginBottom: "0.25rem" }}>
          Resource Manager
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#4a6080", marginBottom: "2rem" }}>
          {total > 0 ? `${total} resources in index` : "Loading index…"}
          {" · "}
          <span style={{ fontSize: "0.8rem", color: "#8aa0b8" }}>
            Changes are live on this instance — not persisted to disk
          </span>
        </p>

        {/* Secret input */}
        {!secretSaved ? (
          <div style={s({ background: "rgba(8,38,83,0.04)", border: "1px solid rgba(8,38,83,0.12)", borderRadius: 12, padding: "1.25rem", marginBottom: "2rem" })}>
            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#062a52", marginBottom: "0.5rem" }}>Enter admin secret to continue</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveSecret()}
                placeholder="ADMIN_SECRET"
                style={{ flex: 1, padding: "0.6rem 0.9rem", borderRadius: 8, border: "1px solid rgba(8,38,83,0.18)", fontSize: "0.875rem", color: "#062a52" }} />
              <button type="button" onClick={saveSecret} disabled={!secret.trim()}
                style={{ padding: "0.6rem 1.25rem", borderRadius: 8, background: secret.trim() ? "#062a52" : "#c5d0de", color: "white", fontWeight: 700, fontSize: "0.875rem", border: 0, cursor: secret.trim() ? "pointer" : "not-allowed" }}>
                Unlock →
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#4a6080" }}>🔓 Admin unlocked</span>
            <button type="button" onClick={() => { sessionStorage.removeItem("sc_admin_secret"); setSecretSaved(false); setSecret(""); setResources([]); }}
              style={{ fontSize: "0.75rem", color: "#8aa0b8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Lock
            </button>
          </div>
        )}

        {secretSaved && (
          <>
            {/* Resource table */}
            <div style={s({ background: "white", border: "1px solid rgba(8,38,83,0.1)", borderRadius: 14, overflow: "hidden", marginBottom: "2rem" })}>
              {/* Table header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem 1.25rem", borderBottom: "1px solid rgba(8,38,83,0.08)" }}>
                <input
                  type="text" value={q} onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchResources()}
                  placeholder="Search resources…"
                  style={{ flex: 1, padding: "0.5rem 0.85rem", borderRadius: 8, border: "1px solid rgba(8,38,83,0.15)", fontSize: "0.8rem", color: "#062a52" }} />
                <button type="button" onClick={fetchResources}
                  style={{ padding: "0.5rem 0.9rem", borderRadius: 8, border: "1px solid rgba(8,38,83,0.15)", background: "white", fontSize: "0.8rem", color: "#4a6080", cursor: "pointer" }}>
                  Search
                </button>
                <button type="button" onClick={() => router.push("/admin/resource/new")}
                  style={{ padding: "0.5rem 1.1rem", borderRadius: 8, background: "#062a52", color: "white", fontWeight: 700, fontSize: "0.8rem", border: 0, cursor: "pointer", whiteSpace: "nowrap" }}>
                  + Add resource
                </button>
              </div>

              {/* Error / loading */}
              {loadStatus === "error" && (
                <div style={{ padding: "1rem 1.25rem", color: "#991b1b", fontSize: "0.8rem" }}>
                  ✗ {loadError}
                </div>
              )}
              {loadStatus === "loading" && (
                <div style={{ padding: "1rem 1.25rem", color: "#4a6080", fontSize: "0.8rem" }}>Loading…</div>
              )}

              {/* Table */}
              {resources.length > 0 && (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(8,38,83,0.03)" }}>
                      <th style={{ padding: "0.6rem 1.25rem", textAlign: "left", color: "#4a6080", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Title</th>
                      <th style={{ padding: "0.6rem 1rem", textAlign: "left", color: "#4a6080", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Topics</th>
                      <th style={{ padding: "0.6rem 1rem", textAlign: "left", color: "#4a6080", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Locations</th>
                      <th style={{ padding: "0.6rem 1rem" }} />
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((r, i) => (
                      <tr key={r.id} style={{ borderTop: i > 0 ? "1px solid rgba(8,38,83,0.07)" : undefined }}>
                        <td style={{ padding: "0.7rem 1.25rem", color: "#062a52", maxWidth: 320 }}>
                          <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                          <div style={{ fontSize: "0.7rem", color: "#8aa0b8", marginTop: 2 }}>
                            id:{r.id}
                            {r.link && <span> · <a href={r.link} target="_blank" rel="noopener noreferrer" style={{ color: "#d4a017" }}>link</a></span>}
                            {r.email && <span> · {r.email}</span>}
                          </div>
                        </td>
                        <td style={{ padding: "0.7rem 1rem", color: "#4a6080", maxWidth: 200 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.topics.slice(0, 2).join(", ")}{r.topics.length > 2 ? ` +${r.topics.length - 2}` : ""}
                          </div>
                        </td>
                        <td style={{ padding: "0.7rem 1rem", color: "#4a6080" }}>
                          {r.locations.length >= 29 ? "Statewide" : `${r.locations.length} counties`}
                        </td>
                        <td style={{ padding: "0.7rem 1rem", whiteSpace: "nowrap" }}>
                          <button type="button" onClick={() => router.push(`/admin/resource/${r.id}/edit`)}
                            style={{ fontSize: "0.75rem", color: "#062a52", background: "none", border: "1px solid rgba(8,38,83,0.2)", borderRadius: 6, padding: "0.25rem 0.6rem", cursor: "pointer", marginRight: 6 }}>
                            Edit
                          </button>
                          {deleteId === r.id ? (
                            <>
                              <button type="button" onClick={() => handleDelete(r.id)}
                                disabled={deleteStatus === "loading"}
                                style={{ fontSize: "0.75rem", color: "white", background: "#dc2626", border: 0, borderRadius: 6, padding: "0.25rem 0.6rem", cursor: "pointer", marginRight: 4 }}>
                                {deleteStatus === "loading" ? "…" : "Confirm"}
                              </button>
                              <button type="button" onClick={() => setDeleteId(null)}
                                style={{ fontSize: "0.75rem", color: "#4a6080", background: "none", border: "none", cursor: "pointer" }}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button type="button" onClick={() => setDeleteId(r.id)}
                              style={{ fontSize: "0.75rem", color: "#dc2626", background: "none", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 6, padding: "0.25rem 0.6rem", cursor: "pointer" }}>
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {resources.length === 0 && loadStatus === "idle" && secretSaved && (
                <div style={{ padding: "1.5rem 1.25rem", color: "#8aa0b8", fontSize: "0.8rem" }}>
                  {q ? "No resources match your search." : "No resources loaded yet."}
                </div>
              )}
            </div>

            {/* System: reindex */}
            <div style={s({ background: "rgba(8,38,83,0.04)", border: "1px solid rgba(8,38,83,0.1)", borderRadius: 12, padding: "1.25rem" })}>
              <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#062a52", marginBottom: "0.25rem" }}>System operations</p>
              <p style={{ fontSize: "0.75rem", color: "#4a6080", marginBottom: "0.75rem" }}>
                After editing <code style={{ background: "#e8eef6", padding: "1px 4px", borderRadius: 3 }}>data/resources.json</code> and regenerating embeddings, hot-swap the index without a server restart.
              </p>
              <button type="button" onClick={handleReindex} disabled={reindexStatus === "loading"}
                style={{ padding: "0.5rem 1.1rem", borderRadius: 8, background: reindexStatus === "loading" ? "#c5d0de" : "#062a52", color: "white", fontWeight: 700, fontSize: "0.8rem", border: 0, cursor: reindexStatus === "loading" ? "not-allowed" : "pointer" }}>
                {reindexStatus === "loading" ? "Reloading…" : "↺ Reload index"}
              </button>
              {reindexResult && (
                <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: reindexResult.ok ? "#166534" : "#991b1b" }}>
                  {reindexResult.ok
                    ? `✓ Reloaded — ${reindexResult.count} resources · ${reindexResult.dim}-dim · ${reindexResult.reloadedIn}`
                    : `✗ ${reindexResult.error}`}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
