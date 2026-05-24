"use client";

import { useState } from "react";
import { BrainV2Scene } from "./BrainV2Scene.client";
import { DetailPanel, type Selection } from "./DetailPanel.client";
import { StatStrip } from "./StatStrip";
import type { BrainV2Payload } from "./types";

// V2.0.2 layout: vertical stack, brain canvas is a 1:1 square sized
// off the viewport height, detail cards live ABOVE the brain in a
// fixed-min-height slot so the layout doesn't jump when cards open.
// (Was V2.0.1 side-by-side grid; Spencer's preference is square brain
// front-and-center.)

const SLOT_MIN_HEIGHT = "8rem";
const BRAIN_MAX_WIDTH = "min(80vh, 100%)";

export function BrainPageShell({ payload }: { payload: BrainV2Payload }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <StatStrip payload={payload} />

      <DetailSlot
        payload={payload}
        selection={selection}
        onClose={() => setSelection(null)}
      />

      <div
        className="aspect-square mx-auto w-full"
        style={{ maxWidth: BRAIN_MAX_WIDTH }}
      >
        <BrainV2Scene
          payload={payload}
          hoveredDomain={hoveredDomain}
          onHoverDomain={setHoveredDomain}
          onSelect={setSelection}
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
  return (
    <div
      className="w-full mx-auto"
      style={{ maxWidth: BRAIN_MAX_WIDTH, minHeight: SLOT_MIN_HEIGHT }}
    >
      {selection ? (
        <div className="max-h-[42vh] overflow-y-auto">
          <DetailPanel
            payload={payload}
            selection={selection}
            onClose={onClose}
          />
        </div>
      ) : (
        <div
          className="h-full flex items-center justify-center rounded-lg border border-dashed border-stewart-border bg-stewart-card/30 p-4 text-center"
          style={{ minHeight: SLOT_MIN_HEIGHT }}
        >
          <p className="text-sm text-stewart-muted leading-relaxed max-w-md">
            <span className="text-stewart-text font-medium">
              Click a planet, moon, tile, or the crystal core
            </span>{" "}
            to see Stewart&apos;s full read for that node.
          </p>
        </div>
      )}
    </div>
  );
}
