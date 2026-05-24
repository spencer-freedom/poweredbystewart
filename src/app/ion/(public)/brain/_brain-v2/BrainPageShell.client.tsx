"use client";

import { useState } from "react";
import { BrainV2Scene } from "./BrainV2Scene.client";
import { DetailPanel, type Selection } from "./DetailPanel.client";
import { StatStrip } from "./StatStrip";
import type { BrainV2Payload } from "./types";

// V2.0.1 layout shell. Owns the selection + hovered-domain state and
// composes the page as a side-by-side grid (stat strip on top, brain
// on the left, detail panel docked in its own right column). The
// brain canvas no longer gets occluded when a card opens — both share
// the row, not the layer.
//
// Mobile (<lg): brain stacks on top, panel below, both full-width.

export function BrainPageShell({ payload }: { payload: BrainV2Payload }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <StatStrip payload={payload} />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem] gap-4 items-start">
        <BrainV2Scene
          payload={payload}
          hoveredDomain={hoveredDomain}
          onHoverDomain={setHoveredDomain}
          onSelect={setSelection}
        />
        <DetailSlot
          payload={payload}
          selection={selection}
          onClose={() => setSelection(null)}
        />
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
  if (!selection) {
    return (
      <aside className="rounded-lg border border-dashed border-stewart-border bg-stewart-card/40 p-6 text-sm text-stewart-muted lg:sticky lg:top-4">
        <p className="text-xs uppercase tracking-wider text-stewart-muted font-semibold mb-2">
          No selection
        </p>
        <p className="leading-relaxed">
          Click anywhere on the crystal core, a tile inside it, or any
          orbiting call planet (or its moons) to open the corresponding
          card stack here.
        </p>
      </aside>
    );
  }
  return (
    <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] overflow-y-auto">
      <DetailPanel
        payload={payload}
        selection={selection}
        onClose={onClose}
      />
    </aside>
  );
}
