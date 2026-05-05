import { fetchDecisionTree } from "@/lib/ion-api";
import { ErrorPanel } from "../../_components/error-panel";
import { WikiBrain } from "../../_components/wiki-brain";
import { StewartCallout } from "../../_components/stewart-callout";

export const dynamic = "force-dynamic";

export default async function WikiBrainPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  try {
    const data = await fetchDecisionTree(token);
    const clusterCount = data.clusters?.length ?? 0;
    const trackCount = data.word_tracks?.length ?? 0;

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-stewart-text">
            Stewart&apos;s Brain
          </h1>
          <p className="text-stewart-muted mt-1 text-sm">
            {clusterCount} objection clusters · {trackCount} winning tracks ·
            calls bridge clusters they touched. Force-directed view; pan +
            zoom + click a track to read the verbatim and play audio.
          </p>
        </div>

        <StewartCallout kind="learning">
          a concept-level view (clusters / tracks / calls). Once Archivist
          ships, this graph extends to themes and word-level concepts —
          richer communities, more bridges, deeper traversal.
        </StewartCallout>

        <WikiBrain data={data} token={token} />
      </div>
    );
  } catch (e) {
    return <ErrorPanel error={e instanceof Error ? e.message : String(e)} />;
  }
}
