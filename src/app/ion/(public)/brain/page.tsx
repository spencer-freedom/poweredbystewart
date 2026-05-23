import Link from "next/link";
import { loadBrainV2 } from "./_brain-v2/load";
import { BrainV2Scene } from "./_brain-v2/BrainV2Scene.client";
import { StatStrip } from "./_brain-v2/StatStrip";

// Public mirror of Stewart's brain. V2 — crystal core + planets +
// moons + grounding vectors + gray-matter stickiness + quantity-per-
// section absorption.

export const dynamic = "force-dynamic";

export default async function PublicBrainPage() {
  const payload = await loadBrainV2();
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <StatStrip payload={payload} />
        <Link
          href="/ion"
          className="text-sm text-stewart-muted hover:text-stewart-text transition-colors shrink-0 ml-4"
        >
          &larr; Back to the demo
        </Link>
      </div>
      <BrainV2Scene payload={payload} />
    </div>
  );
}
