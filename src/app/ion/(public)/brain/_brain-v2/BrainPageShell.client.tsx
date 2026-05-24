"use client";

import { useState } from "react";
import { BrainV2Scene } from "./BrainV2Scene.client";
import { DetailPanel, type Selection } from "./DetailPanel.client";
import { Legend } from "./Legend.client";
import { StatStrip } from "./StatStrip";
import type { BrainV2Payload } from "./types";

const BRAIN_MAX_WIDTH = "min(80vh, 100%)";

export function BrainPageShell({ payload }: { payload: BrainV2Payload }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <StatStrip payload={payload} />

      <div className="w-full mx-auto" style={{ maxWidth: BRAIN_MAX_WIDTH }}>
        <Legend />
      </div>

      <div
        className="aspect-square mx-auto w-full relative"
        style={{ maxWidth: BRAIN_MAX_WIDTH }}
      >
        <BrainV2Scene
          payload={payload}
          hoveredDomain={hoveredDomain}
          onHoverDomain={setHoveredDomain}
          onSelect={setSelection}
        />
        {selection ? <ScrollHint selection={selection} /> : null}
      </div>

      <DetailSlot
        payload={payload}
        selection={selection}
        onClose={() => setSelection(null)}
      />
    </div>
  );
}

function ScrollHint({ selection }: { selection: Selection }) {
  const label =
    selection.kind === "core"
      ? "schema overview"
      : selection.kind === "tile"
      ? selection.tile.schema_section || "schema section"
      : selection.kind === "planet" || selection.kind === "moon"
      ? selection.planet.call_id
      : "details";
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-1 motion-safe:animate-bounce">
      <p className="text-base sm:text-lg text-stewart-accent font-semibold leading-none px-3 py-1.5 rounded-full bg-stewart-bg/85 border border-stewart-accent/40 backdrop-blur-sm whitespace-nowrap">
        Scroll down for {label}
      </p>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-stewart-accent drop-shadow"
        aria-hidden
      >
        <path d="M7 13l5 5 5-5" />
        <path d="M7 6l5 5 5-5" opacity="0.6" />
      </svg>
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
