"use client";

import { useState } from "react";
import type { Filters } from "@/lib/map-config";
import { useSavedSearches, autoLabel } from "@/hooks/useSavedSearches";

type Props = {
  filters: Filters;
  onApply: (filters: Filters) => void;
};

export function SavedSearchDrawer({ filters, onApply }: Props) {
  const { searches, saveSearch, deleteSearch, resolveFilters, isSaved } =
    useSavedSearches();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const currentlySaved = isSaved(filters);

  const handleSave = () => {
    const label = labelInput.trim() || autoLabel(filters);
    saveSearch(label, filters);
    setLabelInput("");
    setSaving(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const handleApply = (id: string) => {
    const restored = resolveFilters(id);
    if (restored) {
      onApply(restored);
      setOpen(false);
    }
  };

  return (
    <div className="border-t border-rule/70 pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
          Saved Searches
          {searches.length > 0 && (
            <span className="ml-1.5 rounded-full bg-accent text-surface px-1.5 py-0.5 text-[9px] font-bold">
              {searches.length}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {!currentlySaved && (
            <button
              type="button"
              id="save-current-search"
              onClick={() => setSaving((v) => !v)}
              className="text-[11px] font-semibold text-accent hover:text-accent-hover"
            >
              {savedFlash ? "✓ Saved!" : "Save current"}
            </button>
          )}
          {searches.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-[11px] font-medium text-ink-soft hover:text-ink"
            >
              {open ? "Hide" : "View all"}
            </button>
          )}
        </div>
      </div>

      {saving && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            autoFocus
            placeholder={autoLabel(filters)}
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setSaving(false);
            }}
            className="flex-1 rounded-lg border border-rule bg-surface px-3 py-1.5 text-[12px] text-ink placeholder:text-ink-mute focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-ink px-3 py-1.5 text-[11px] font-semibold text-surface hover:bg-ink-soft"
          >
            Save
          </button>
        </div>
      )}

      {open && searches.length > 0 && (
        <ul className="mt-2 space-y-1">
          {searches.map((s) => (
            <li
              key={s.id}
              className="group flex items-center gap-2 rounded-lg border border-rule/70 bg-surface px-3 py-2"
            >
              <button
                type="button"
                onClick={() => handleApply(s.id)}
                className="flex-1 text-left"
              >
                <span className="block text-[12.5px] font-medium text-ink group-hover:text-accent">
                  {s.label}
                </span>
                {s.lastUsedAt && (
                  <span className="block text-[10.5px] text-ink-mute">
                    Used {formatRelative(s.lastUsedAt)}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => deleteSearch(s.id)}
                aria-label={`Delete saved search "${s.label}"`}
                className="shrink-0 text-ink-mute opacity-0 hover:text-ink group-hover:opacity-100 transition-opacity"
              >
                <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
                  <path
                    d="M3 3l8 8M11 3L3 11"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && searches.length === 0 && (
        <p className="mt-2 text-[12px] text-ink-mute">
          No saved searches yet. Use filters and click "Save current".
        </p>
      )}
    </div>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
