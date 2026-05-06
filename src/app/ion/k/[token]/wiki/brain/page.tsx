import { fetchBrainGraphDemo } from "@/lib/stewart-api";
import { decodeTokenRole } from "@/lib/viewer";
import { ErrorPanel } from "../../_components/error-panel";
import { StewartCallout } from "../../_components/stewart-callout";
import { BrainOrchestrator } from "../../_components/brain/brain-orchestrator";
import { adaptWikiGraph } from "../../_components/brain/brain-adapt";
import { buildMockGraph } from "../../_components/brain/brain-mock";

export const dynamic = "force-dynamic";

// Dev-only bypass for the role gate, used for local prototyping with a
// non-system_owner token. Set NEXT_PUBLIC_BRAIN_DEV_BYPASS=1 in .env.local.
// Production deploys don't have this var.
const DEV_BYPASS = process.env.NEXT_PUBLIC_BRAIN_DEV_BYPASS === "1";

export default async function WikiBrainPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // UX-only role gate via token base64 decode (HMAC stays backend-verified
  // on every data fetch). Generic denial — don't reveal that brain exists
  // to non-owner viewers.
  const decoded = decodeTokenRole(token);
  const allowed = DEV_BYPASS || decoded.role === "system_owner";

  if (!allowed) {
    return (
      <ErrorPanel error="This view isn't available on your account." />
    );
  }

  // Fetch the real graph. If backend role-gates and rejects, render the
  // same generic denial. Otherwise adapt the payload to the canvas shape.
  let graph;
  try {
    const real = await fetchBrainGraphDemo(token, { limitPerEvent: 8 });
    graph = adaptWikiGraph(real);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/^wiki\/graph(\/demo)? 40[13]/.test(msg)) {
      return (
        <ErrorPanel error="This view isn't available on your account." />
      );
    }
    // Fall back to mock if the real endpoint errors any other way (5xx,
    // network) — better demo experience than a hard error during a live
    // session. Stewart-voice notice flags the degraded state.
    graph = buildMockGraph();
    return (
      <div className="space-y-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold text-stewart-text">
            Stewart&apos;s Brain
          </h1>
          <p className="text-stewart-muted text-xs font-mono">
            {graph.total_calls} calls · {graph.total_objections} objections ·{" "}
            {graph.total_solutions} solutions
          </p>
        </div>
        <StewartCallout kind="flag">
          The live graph endpoint is hiccuping ({msg}). Falling back to a
          mock for now — refresh in a moment.
        </StewartCallout>
        <BrainOrchestrator data={graph} token={token} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Compact one-line title row — chrome reduced so the brain
          dominates the viewport. Counts moved into the orchestrator
          footer / overlay. */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-xl font-semibold text-stewart-text">
          Stewart&apos;s Brain
        </h1>
        <p className="text-stewart-muted text-xs font-mono">
          {graph.total_calls} calls · {graph.total_objections} objections ·{" "}
          {graph.total_solutions} solutions
        </p>
      </div>
      <BrainOrchestrator data={graph} token={token} />
    </div>
  );
}
