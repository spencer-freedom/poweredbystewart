import Link from "next/link";
import { loadBrainV1 } from "./_brain-v1/load";
import { BrainRendererV1 } from "./_brain-v1/BrainRendererV1.client";

// Public mirror of the Stewart brain. No auth (Clerk integration later).
// Reads the 101 codex-section JSONs server-side at request time and
// passes a single typed payload to the V1 renderer.

export const dynamic = "force-dynamic";

export default async function PublicBrainPage() {
  const payload = await loadBrainV1();
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-end">
        <Link
          href="/ion"
          className="text-sm text-stewart-muted hover:text-stewart-text transition-colors"
        >
          &larr; Back to the demo
        </Link>
      </div>
      <BrainRendererV1 payload={payload} />
    </div>
  );
}
