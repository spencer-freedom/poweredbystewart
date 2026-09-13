"use client";

import { useState } from "react";
import Link from "next/link";
import { BrainV2Scene } from "../../(public)/brain/_brain-v2/BrainV2Scene.client";
import type { BrainV2Payload } from "../../(public)/brain/_brain-v2/types";

// The scale reveal. The full /ion/brain renderer (auto-rotating, drag to
// spin, hover to light a domain) with no legend, no stat strip, no detail
// panel — the pitch only needs the picture and three numbers. Clicking a
// call is a no-op here; the full brain is one link away.

export function BrainReveal({ payload }: { payload: BrainV2Payload }) {
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);
  const s = payload.stats;

  return (
    <div className="w-full">
      <div className="aspect-square mx-auto w-full max-w-[min(62vh,100%)]">
        <BrainV2Scene
          payload={payload}
          hoveredDomain={hoveredDomain}
          onHoverDomain={setHoveredDomain}
          onSelect={() => {}}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-baseline justify-center gap-x-8 gap-y-2 text-center">
        <Stat n={s.calls_total} label="calls read" />
        <Stat n={s.cherrypicks_total} label="coachable moments found" />
        <Stat n={s.sections_lit} label="sections of your playbook lit" />
      </div>

      <p className="mt-4 text-center text-xs text-stewart-muted">
        Drag to spin.{" "}
        <Link href="/ion/brain" className="text-stewart-accent hover:underline">
          Open the full brain &rarr;
        </Link>
      </p>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <p className="text-stewart-muted">
      <span className="font-mono text-2xl sm:text-3xl font-bold text-stewart-text">
        {n.toLocaleString()}
      </span>{" "}
      <span className="text-sm">{label}</span>
    </p>
  );
}
