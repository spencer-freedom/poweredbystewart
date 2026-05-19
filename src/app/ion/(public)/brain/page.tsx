import Link from "next/link";
import { BrainOrchestrator } from "../../k/[token]/_components/brain/brain-orchestrator";
import { buildMockGraph } from "../../k/[token]/_components/brain/brain-mock";

// Public mirror of /ion/k/{token}/wiki/brain.
//
// We deliberately import the existing component without refactoring it.
// The token-gated route stays the canonical owner of the brain renderer;
// this page is a no-auth shell around it for the Ion pitch surface.
//
// Data source: buildMockGraph(). The real brain endpoint is HMAC-token
// gated, so a public route can't reach it today. When the demo needs to
// render real Ion data publicly, two options exist (out of scope for this
// PR): (a) a backend "demo" token with restricted scopes, or (b) a
// server-side fetch from the public route that injects credentials.
//
// Token prop to BrainOrchestrator is empty here — it's only used downstream
// for HMAC-signed audio URLs, which the mock doesn't need.

export const dynamic = "force-dynamic";

export default function PublicBrainPage() {
  const graph = buildMockGraph();
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold text-stewart-text">
            Stewart&apos;s Brain
          </h1>
          <p className="text-stewart-muted text-xs font-mono">
            {graph.total_calls} calls · {graph.total_objections} objections ·{" "}
            {graph.total_solutions} solutions
          </p>
        </div>
        <Link
          href="/ion"
          className="text-sm text-stewart-muted hover:text-stewart-text transition-colors"
        >
          ← Back to the demo
        </Link>
      </div>
      <BrainOrchestrator data={graph} token="" />
    </div>
  );
}
