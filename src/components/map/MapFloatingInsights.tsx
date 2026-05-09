"use client";

import { EcosystemPulse } from "@/components/investor/EcosystemPulse";
import { ThesisPresetsBar } from "@/components/investor/ThesisPresetsBar";
import type { EcosystemStats } from "@/lib/investor/ecosystemStats";
import type { ThesisPreset } from "@/lib/investor/thesisPresets";

type Props = {
  stats: EcosystemStats;
  thesisPresets: ThesisPreset[];
  onThesisApply: (preset: ThesisPreset) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  /** Extra left padding when the discovery drawer is open (desktop). */
  padForDrawer: boolean;
};

export function MapFloatingInsights({
  stats,
  thesisPresets,
  onThesisApply,
  expanded,
  onToggleExpanded,
  padForDrawer,
}: Props) {
  return (
    <div
      className={`pointer-events-none flex justify-center px-3 pt-3 md:justify-start ${
        padForDrawer ? "md:pl-[372px]" : ""
      }`}
    >
      {expanded ? (
        <div className="pointer-events-auto w-full max-w-[min(44rem,calc(100vw-1.5rem))] rounded-2xl border border-rule/90 bg-surface-elev/96 shadow-[0_4px_24px_-4px_rgba(11,27,51,0.2)] backdrop-blur-md">
          <div className="flex items-center justify-end gap-2 border-b border-rule/60 px-2 py-1.5">
            <button
              type="button"
              onClick={onToggleExpanded}
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-mute hover:bg-surface-tint hover:text-ink"
            >
              Hide stats
            </button>
          </div>
          <div className="max-h-[min(42vh,320px)] overflow-y-auto overscroll-y-contain px-1 py-2">
            <EcosystemPulse stats={stats} />
            <ThesisPresetsBar presets={thesisPresets} onApply={onThesisApply} />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggleExpanded}
          className="pointer-events-auto rounded-full border border-rule/90 bg-surface-elev/96 px-3 py-2 text-[11px] font-semibold text-ink shadow-md backdrop-blur-md hover:border-accent"
        >
          Ecosystem stats
        </button>
      )}
    </div>
  );
}
