import { fetchDecisionTree, type DecisionTreePayload } from "@/lib/ion-api";
import { ErrorPanel } from "./_components/error-panel";

export const dynamic = "force-dynamic";

export default async function IonLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let data: DecisionTreePayload;
  try {
    data = await fetchDecisionTree(token);
  } catch (e) {
    return <ErrorPanel error={e instanceof Error ? e.message : String(e)} />;
  }

  const stats = data.pipeline_stats;
  const clusters = [...(data.clusters || [])].sort(
    (a, b) => b.frequency - a.frequency
  );
  const lead = clusters[0];
  const totalTracks = data.word_tracks?.length || 0;

  return (
    <div className="space-y-10">
      <section>
        <p className="text-xs uppercase tracking-wider text-stewart-muted mb-3">
          Hi Kenny — built on your floor's calls
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-stewart-text">
          {lead ? (
            <>
              The biggest pattern in your floor:{" "}
              <span className="text-stewart-accent">{lead.name}</span> —{" "}
              {Math.round(lead.win_rate * 100)}% win rate across{" "}
              {lead.frequency} calls.
            </>
          ) : (
            "Decision tree built on your inside-sales calls."
          )}
        </h1>
        {lead && (
          <p className="mt-4 text-stewart-muted max-w-3xl">
            Across {clusters.length} objection clusters, your reps are running{" "}
            {totalTracks} distinct winning word tracks — each one with verbatim
            attribution to the call and rep that earned it. Open the Decision
            Tree to explore.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-stewart-muted mb-3">
          The methodology in 30 seconds
        </h2>
        <div className="grid sm:grid-cols-4 gap-3">
          <Stat label="calls in your sample" value={stats.n_received} />
          <Stat label="real sales conversations" value={stats.n_real_sales} />
          <Stat label="advances (appts booked)" value={stats.n_wins} />
          <Stat label="objection clusters" value={clusters.length} accent />
        </div>
        <p className="mt-4 text-sm text-stewart-muted leading-relaxed max-w-3xl">
          Every winning word track in this report is a verbatim line from a
          real call, attributed to the rep who said it and the prospect who
          responded. Nothing here is generic sales theory — it&apos;s your
          floor, in your prospects&apos; words.
        </p>
      </section>

      {data.executive_summary && (
        <section>
          <h2 className="text-sm uppercase tracking-wider text-stewart-muted mb-3">
            What we found
          </h2>
          <div className="bg-stewart-card border border-stewart-border rounded-lg p-6 text-stewart-text leading-relaxed whitespace-pre-wrap">
            {data.executive_summary}
          </div>
        </section>
      )}

      {data.noise_disclaimer && (
        <section>
          <h2 className="text-sm uppercase tracking-wider text-stewart-muted mb-3">
            Honest signal-to-noise read
          </h2>
          <div className="border border-stewart-warning/40 bg-stewart-warning/5 rounded-lg p-5 text-sm text-stewart-text leading-relaxed">
            {data.noise_disclaimer}
          </div>
          {data.kenny_data_ask && (
            <p className="mt-3 text-sm text-stewart-muted leading-relaxed">
              {data.kenny_data_ask}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-4 " +
        (accent
          ? "border-stewart-accent/40 bg-stewart-accent/5"
          : "border-stewart-border bg-stewart-card")
      }
    >
      <div
        className={
          "text-2xl font-bold " +
          (accent ? "text-stewart-accent" : "text-stewart-text")
        }
      >
        {value}
      </div>
      <div className="text-xs text-stewart-muted mt-1">{label}</div>
    </div>
  );
}
