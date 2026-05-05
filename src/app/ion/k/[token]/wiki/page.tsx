import { fetchDecisionTree } from "@/lib/ion-api";
import { ErrorPanel } from "../_components/error-panel";
import { WikiGraph } from "../_components/wiki-graph";
import { StewartCallout } from "../_components/stewart-callout";

export const dynamic = "force-dynamic";

export default async function WikiPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  try {
    const data = await fetchDecisionTree(token);
    const clusterCount = data.clusters?.length ?? 0;
    const trackCount = data.word_tracks?.length ?? 0;
    const lossCount = data.losing_patterns?.length ?? 0;

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-stewart-text">
            Pattern Wiki
          </h1>
          <p className="text-stewart-muted mt-1 text-sm">
            {clusterCount} objection clusters · {trackCount} winning word
            tracks · {lossCount} losing patterns. Dashed violet edges connect
            tracks that came from the same call.
          </p>
        </div>

        <StewartCallout kind="wip">
          The full cross-call traversal lights up when Archivist finishes
          processing. This view is the cluster overview in the meantime.
        </StewartCallout>

        <WikiGraph data={data} token={token} />

        <p className="text-xs text-stewart-muted">
          Click a cluster to collapse it. Click a winning track or losing
          pattern to read the verbatim and play the audio. Pan + scroll to
          zoom.
        </p>
      </div>
    );
  } catch (e) {
    return <ErrorPanel error={e instanceof Error ? e.message : String(e)} />;
  }
}
