import { fetchDecisionTree } from "@/lib/ion-api";
import { canAccess } from "@/lib/viewer";
import { ErrorPanel } from "../../_components/error-panel";
import { StewartCallout } from "../../_components/stewart-callout";
import { BrainOrchestrator } from "../../_components/brain/brain-orchestrator";
import { buildMockGraph } from "../../_components/brain/brain-mock";

export const dynamic = "force-dynamic";

// Dev-only bypass for the role gate, used during local prototyping
// before backend ships the system_owner token. Set
// NEXT_PUBLIC_BRAIN_DEV_BYPASS=1 in .env.local. Production deploys
// don't have this var; the gate enforces normally.
const DEV_BYPASS = process.env.NEXT_PUBLIC_BRAIN_DEV_BYPASS === "1";

export default async function WikiBrainPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Role check via the cheap /decision-tree fetch (returns viewer when
  // backend ships migration 017). System_owner only — rep / manager /
  // leader / tenant_admin all get the generic denial.
  let viewerAllowed = DEV_BYPASS;
  try {
    const data = await fetchDecisionTree(token);
    if (canAccess(data.viewer, ["system_owner"])) {
      viewerAllowed = true;
    }
  } catch (e) {
    if (!DEV_BYPASS) {
      return <ErrorPanel error={e instanceof Error ? e.message : String(e)} />;
    }
  }

  if (!viewerAllowed) {
    // Generic denial — don't reveal that brain exists. Same shape as
    // expired-link so probing the URL doesn't surface the moat.
    return (
      <ErrorPanel error="This view isn't available on your account." />
    );
  }

  // Mock graph until /api/stewart/wiki/graph ships (backend Day 7).
  // Same call signature swap when the real endpoint lands.
  const graph = buildMockGraph();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-stewart-text">
          Stewart&apos;s Brain
        </h1>
        <p className="text-stewart-muted mt-1 text-sm">
          Every call, every objection, every solution as a connected node.
          Search to find patterns; click any node to read the verbatim and
          play the moment.
        </p>
      </div>

      <StewartCallout kind="learning">
        a mock brain (~80 nodes) for visual review. The full graph (
        {graph.total_calls}+ calls, {graph.total_objections}+ objections,
        thousands of similarity edges) lights up when Archivist&apos;s
        graph endpoint ships.
      </StewartCallout>

      <BrainOrchestrator data={graph} token={token} />
    </div>
  );
}
