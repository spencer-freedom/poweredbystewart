import Link from "next/link";
import { fetchDecisionTree } from "@/lib/ion-api";
import { ErrorPanel } from "../_components/error-panel";
import { DecisionTree } from "../_components/decision-tree";

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

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-stewart-text">
              Decision Tree — {clusters.length} Objection Clusters
            </h1>
            </div>
          <div className="flex items-center gap-3 text-xs text-stewart-muted">
            <Legend swatch="bg-violet-300" label="Objection cluster" />
            <Legend swatch="bg-sky-200" label="Winning word track" />
            <Legend swatch="bg-rose-300" label="What didn't work" />
          </div>
        </div>

        <DecisionTree data={data} token={token} />

        <p className="text-xs text-stewart-muted">
          Animated green edges between word tracks are observed second-attempt
          patterns that worked. Dashed amber/red are partial or failed
          follow-ups.
        </p>
        <p className="pt-2">
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

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded ${swatch}`} />
      {label}
    </span>
  );
}
