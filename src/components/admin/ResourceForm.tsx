"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ALL_COUNTIES, ALL_TOPICS, ALL_COMMUNITIES, ALL_INDUSTRIES } from "@/lib/adminConstants";

type FormValues = {
  title: string;
  description: string;
  link: string;
  email: string;
  topics: string[];
  communities: string[];
  industries: string[];
  locations: string[];
};

const EMPTY: FormValues = {
  title: "", description: "", link: "", email: "",
  topics: [], communities: [], industries: [], locations: [],
};

interface ResourceFormProps {
  mode: "create" | "edit";
  id?: number;
  initial?: Partial<FormValues>;
}

function CheckGroup({
  label, options, selected, onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(val: string) {
    onChange(selected.includes(val) ? selected.filter((x) => x !== val) : [...selected, val]);
  }
  return (
    <fieldset className="mt-5">
      <legend className="block text-[13px] font-semibold text-[#062a52] mb-2">{label}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-1.5 text-[13px] text-[#2a4a6a] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="accent-[#d4a017] h-3.5 w-3.5"
            />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function LocationGroup({
  selected, onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const allSelected = ALL_COUNTIES.every((c) => selected.includes(c));

  function toggleAll() {
    onChange(allSelected ? [] : [...ALL_COUNTIES]);
  }
  function toggle(val: string) {
    onChange(selected.includes(val) ? selected.filter((x) => x !== val) : [...selected, val]);
  }

  return (
    <fieldset className="mt-5">
      <legend className="block text-[13px] font-semibold text-[#062a52] mb-2">
        Locations <span className="font-normal text-[#4a6080]">(which counties is this available in?)</span>
      </legend>
      <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#062a52] cursor-pointer select-none mb-2">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="accent-[#d4a017] h-3.5 w-3.5"
        />
        Statewide — all 29 counties
      </label>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pl-1">
        {ALL_COUNTIES.map((county) => (
          <label key={county} className="flex items-center gap-1.5 text-[13px] text-[#2a4a6a] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selected.includes(county)}
              onChange={() => toggle(county)}
              className="accent-[#d4a017] h-3.5 w-3.5"
            />
            {county}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ResourceForm({ mode, id, initial }: ResourceFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>({ ...EMPTY, ...initial });
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [secret, setSecret] = useState("");

  useEffect(() => {
    const s = sessionStorage.getItem("sc_admin_secret") ?? "";
    setSecret(s);
  }, []);

  function set(field: keyof FormValues, value: string | string[]) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  const canSubmit =
    values.title.trim().length > 0 &&
    values.description.trim().length > 0 &&
    values.locations.length > 0 &&
    secret.trim().length > 0 &&
    status !== "saving";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("saving");
    setError("");

    const url = mode === "create" ? "/api/admin/resource" : `/api/admin/resource/${id}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: secret },
        body: JSON.stringify({
          title: values.title.trim(),
          description: values.description.trim(),
          link: values.link.trim() || null,
          email: values.email.trim() || null,
          topics: values.topics,
          communities: values.communities,
          industries: values.industries,
          locations: values.locations,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setStatus("success");
      setTimeout(() => router.push("/admin"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  const inputCls = "mt-1 w-full rounded-lg border border-[rgba(8,38,83,0.18)] bg-white px-3 py-2.5 text-[14px] text-[#062a52] placeholder:text-[#8aa0b8] focus:border-[#d4a017] focus:outline-none focus:ring-2 focus:ring-[#d4a017]/25";
  const labelCls = "block text-[13px] font-semibold text-[#062a52]";

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* Secret warning if not set */}
      {!secret && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          Admin secret not set. Go back to <a href="/admin" className="underline">Admin</a> and enter your secret first.
        </div>
      )}

      {/* Basic info */}
      <div className="rounded-xl border border-[rgba(8,38,83,0.1)] bg-white p-5">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#4a6080] mb-4">Basic information</h2>

        <label className={labelCls} htmlFor="rf-title">Title <span className="text-red-500">*</span></label>
        <input id="rf-title" type="text" value={values.title} onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Utah Small Business Development Center"
          className={inputCls} required />

        <label className={`${labelCls} mt-4 block`} htmlFor="rf-description">Description <span className="text-red-500">*</span></label>
        <textarea id="rf-description" rows={5} value={values.description} onChange={(e) => set("description", e.target.value)}
          placeholder="Describe what this program does, who it serves, and what it offers..."
          className={inputCls + " resize-none"} required />
        <p className="mt-1 text-[11px] text-[#8aa0b8]">This text is embedded for semantic search — be specific and descriptive.</p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="rf-link">Website URL</label>
            <input id="rf-link" type="url" value={values.link} onChange={(e) => set("link", e.target.value)}
              placeholder="https://example.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="rf-email">Contact email</label>
            <input id="rf-email" type="email" value={values.email} onChange={(e) => set("email", e.target.value)}
              placeholder="contact@program.org" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Taxonomy */}
      <div className="rounded-xl border border-[rgba(8,38,83,0.1)] bg-white p-5 mt-4">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#4a6080] mb-2">Classification</h2>
        <p className="text-[12px] text-[#4a6080]">These improve matching accuracy. Select all that apply.</p>

        <CheckGroup label="Topics" options={ALL_TOPICS} selected={values.topics} onChange={(v) => set("topics", v)} />
        <CheckGroup label="Communities served" options={ALL_COMMUNITIES} selected={values.communities} onChange={(v) => set("communities", v)} />
        <CheckGroup label="Industries" options={ALL_INDUSTRIES} selected={values.industries} onChange={(v) => set("industries", v)} />
      </div>

      {/* Locations */}
      <div className="rounded-xl border border-[rgba(8,38,83,0.1)] bg-white p-5 mt-4">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#4a6080] mb-2">
          Availability <span className="text-red-500">*</span>
        </h2>
        <LocationGroup selected={values.locations} onChange={(v) => set("locations", v)} />
      </div>

      {/* Submit */}
      <div className="mt-6 flex items-center gap-3">
        <button type="submit" disabled={!canSubmit}
          className="inline-flex h-10 items-center gap-2 rounded-full px-6 text-[14px] font-semibold transition-all disabled:cursor-not-allowed"
          style={{ background: canSubmit ? "#062a52" : "#c5d0de", color: "white" }}>
          {status === "saving"
            ? "Saving & embedding…"
            : status === "success"
            ? "✓ Saved!"
            : mode === "create" ? "Add resource →" : "Save changes →"}
        </button>
        <button type="button" onClick={() => router.push("/admin")}
          className="text-[13px] font-medium text-[#4a6080] hover:text-[#062a52]">
          Cancel
        </button>
      </div>

      {status === "error" && (
        <p className="mt-3 text-[13px] text-red-600">Error: {error}</p>
      )}

      {mode === "create" && (
        <p className="mt-4 text-[11px] text-[#8aa0b8]">
          ⚠ Changes are live on this server instance but not persisted to disk.
          To make permanent, edit <code>data/resources.json</code> and redeploy.
        </p>
      )}
    </form>
  );
}
