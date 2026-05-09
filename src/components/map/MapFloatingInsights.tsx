"use client";

import { useEffect, useRef } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && typeof window !== "undefined") {
      // Dynamically import Leaflet only on the client
      const L = require("leaflet");
      L.DomEvent.disableScrollPropagation(containerRef.current);
      L.DomEvent.disableClickPropagation(containerRef.current);
    }
  }, [expanded]);

  return (
    <div
      className={`pointer-events-none flex justify-center px-3 pt-3 transition-all duration-300 md:justify-start ${
        padForDrawer ? "md:pl-[372px]" : ""
      }`}
    >
      <div className="relative">
        {!expanded && (
          <button
            type="button"
            onClick={onToggleExpanded}
            className="pointer-events-auto rounded-full border border-rule/90 bg-surface-elev/96 px-4 py-2.5 text-[11px] font-semibold text-ink shadow-[0_2px_12px_-2px_rgba(11,27,51,0.18)] backdrop-blur-md transition-all duration-200 hover:border-accent hover:bg-surface-elev flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Ecosystem Stats
          </button>
        )}

        <div
          ref={containerRef}
          className={`pointer-events-auto w-[min(44rem,calc(100vw-1.5rem))] origin-top-left overflow-hidden rounded-2xl border border-rule/90 bg-surface-elev/98 shadow-[0_4px_24px_-4px_rgba(11,27,51,0.2)] backdrop-blur-md transition-all duration-300 ${
            expanded ? "opacity-100 scale-100 pointer-events-auto" : "absolute top-0 left-0 opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between border-b border-rule/60 bg-surface-tint/50 px-3 py-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Ecosystem Stats
            </span>
            <button
              type="button"
              onClick={onToggleExpanded}
              className="rounded-full p-1 text-ink-mute hover:bg-rule/50 hover:text-ink transition-colors"
              aria-label="Close stats"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="max-h-[min(50vh,400px)] overflow-y-auto overscroll-y-contain px-2 py-3">
            <EcosystemPulse stats={stats} />
            <ThesisPresetsBar presets={thesisPresets} onApply={onThesisApply} />
          </div>
        </div>
      </div>
    </div>
  );
}
