import Link from "next/link";
import { fetchDecisionTree } from "@/lib/ion-api";
import { ErrorPanel } from "../_components/error-panel";
import { ClusterGrid } from "../_components/cluster-grid";

export const dynamic = "force-dynamic";

export default async function TreePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  try {
    const data = await fetchDecisionTree(token);
    const clusters = data.clusters || [];
    const tracksByCluster = new Map<string, number>();
    for (const t of data.word_tracks || []) {
      tracksByCluster.set(t.cluster_id, (tracksByCluster.get(t.cluster_id) || 0) + 1);
    }
    const losingByCluster = new Map<string, number>();
    for (const l of data.losing_patterns || []) {
      losingByCluster.set(l.cluster_id, (losingByCluster.get(l.cluster_id) || 0) + 1);
    }
    const cards = clusters.map((c) => ({
      cluster: c,
      trackCount: tracksByCluster.get(c.id) || 0,
      losingCount: losingByCluster.get(c.id) || 0,
    }));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stewart-text">
            Decision Tree — {clusters.length} Objection Clusters
          </h1>
          <p className="text-stewart-muted mt-1">
            Click any cluster to see winning word tracks with audio attribution
            + observed attempt-1 → attempt-2 transitions.
          </p>
        </div>
        <ClusterGrid cards={cards} basePath={`/ion/k/${token}/tree`} />
        <p className="text-xs text-stewart-muted">
          Win rate = how often reps closed an appointment when this objection
          came up. Frequency = how many calls in the sample touched this
          objection.
        </p>
        <p className="pt-4">
          <Link
            href={`/ion/k/${token}/next-steps`}
            className="text-stewart-accent hover:underline text-sm"
          >
            → Send the next batch (200+ filtered calls) to productionize this
          </Link>
        </p>
      </div>
    );
  } catch (e) {
    return <ErrorPanel error={e instanceof Error ? e.message : String(e)} />;
  }
}
