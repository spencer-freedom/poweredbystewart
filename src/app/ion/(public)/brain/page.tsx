import Link from "next/link";
import { loadBrainV2 } from "./_brain-v2/load";
import { BrainPageShell } from "./_brain-v2/BrainPageShell.client";

// Public mirror of Stewart's brain. V2.0.1 — crystal core with
// per-vertex coloring (continuous, no grout), ion-orbital moons, and
// side-docked detail cards.

export const dynamic = "force-dynamic";

export default async function PublicBrainPage() {
  const payload = await loadBrainV2();
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-end">
        <Link
          href="/ion"
          className="text-sm text-stewart-muted hover:text-stewart-text transition-colors"
        >
          &larr; Back to the demo
        </Link>
      </div>
      <BrainPageShell payload={payload} />
    </div>
  );
}
