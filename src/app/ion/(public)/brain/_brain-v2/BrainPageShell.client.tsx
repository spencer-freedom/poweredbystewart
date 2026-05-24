"use client";

import { useState } from "react";
import {
  BrainV2Scene,
  PLANET_PALETTES,
  DEFAULT_PLANET_PALETTE,
  type PlanetPalette,
} from "./BrainV2Scene.client";
import { DetailPanel, type Selection } from "./DetailPanel.client";
import { StatStrip } from "./StatStrip";
import type { BrainV2Payload } from "./types";

const BRAIN_MAX_WIDTH = "min(80vh, 100%)";

export function BrainPageShell({ payload }: { payload: BrainV2Payload }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);
  const [planetPalette, setPlanetPalette] = useState<PlanetPalette>(
    DEFAULT_PLANET_PALETTE
  );

  return (
    <div className="space-y-4">
      <StatStrip payload={payload} />

      <div
        className="aspect-square mx-auto w-full relative"
        style={{ maxWidth: BRAIN_MAX_WIDTH }}
      >
        <BrainV2Scene
          payload={payload}
          hoveredDomain={hoveredDomain}
          onHoverDomain={setHoveredDomain}
          onSelect={setSelection}
          planetPalette={planetPalette}
        />
        <PlanetPalettePicker active={planetPalette} onPick={setPlanetPalette} />
      </div>

      <DetailSlot
        payload={payload}
        selection={selection}
        onClose={() => setSelection(null)}
      />
    </div>
  );
}

function PlanetPalettePicker({
  active,
  onPick,
}: {
  active: PlanetPalette;
  onPick: (p: PlanetPalette) => void;
}) {
  return (
    <div className="absolute top-3 right-3 z-20 bg-stewart-bg/85 backdrop-blur-sm border border-stewart-border rounded-lg p-2 space-y-1 pointer-events-auto">
      <p className="text-[9px] uppercase tracking-wider text-stewart-muted font-mono px-1">
        Call-node palette
      </p>
      <div className="flex flex-col gap-1">
        {PLANET_PALETTES.map((p) => {
          const isActive = p.id === active.id;
          return (
            <button
              key={p.id}
              onClick={() => onPick(p)}
              className={
                "flex items-center gap-2 px-2 py-1 rounded text-xs text-left transition-colors " +
                (isActive
                  ? "bg-stewart-accent/15 border border-stewart-accent/50 text-stewart-text"
                  : "border border-transparent text-stewart-muted hover:text-stewart-text hover:bg-stewart-card")
              }
            >
              <span
                className="w-3 h-3 rounded-full border border-stewart-border shrink-0"
                style={{ background: p.swatch }}
              />
              <span className="whitespace-nowrap">{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DetailSlot({
  payload,
  selection,
  onClose,
}: {
  payload: BrainV2Payload;
  selection: Selection | null;
  onClose: () => void;
}) {
  return (
    <div className="w-full mx-auto" style={{ maxWidth: BRAIN_MAX_WIDTH }}>
      {selection ? (
        <DetailPanel
          payload={payload}
          selection={selection}
          onClose={onClose}
        />
      ) : (
        <p className="text-center text-xs text-stewart-muted py-3">
          Click a planet, moon, tile, or the crystal core to load that
          node&apos;s full coaching folder here.
        </p>
      )}
    </div>
  );
}
