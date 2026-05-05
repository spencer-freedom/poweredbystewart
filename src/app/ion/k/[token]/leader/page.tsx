import { fetchDecisionTree, type Cluster, type DecisionTreePayload, type LosingPattern, type WordTrack } from "@/lib/ion-api";
import { ErrorPanel } from "../_components/error-panel";
import { StewartCallout } from "../_components/stewart-callout";

export const dynamic = "force-dynamic";

export default async function SalesLeaderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  try {
    const data = await fetchDecisionTree(token);
    return <LeaderView data={data} />;
  } catch (e) {
    return <ErrorPanel error={e instanceof Error ? e.message : String(e)} />;
  }
}

function LeaderView({ data }: { data: DecisionTreePayload }) {
  const stats = data.pipeline_stats;
  const macroPct =
    typeof data.macro_win_rate === "number"
      ? Math.round(data.macro_win_rate * 100)
      : Math.round((stats.n_wins / Math.max(1, stats.n_real_sales)) * 100);
  const clusters = [...(data.clusters || [])].sort(
    (a, b) => b.frequency - a.frequency
  );
  const topCluster = clusters[0];
  const weakestCluster = [...clusters]
    .filter((c) => c.frequency >= 5)
    .sort((a, b) => a.win_rate - b.win_rate)[0];
  const tracks = [...(data.word_tracks || [])]
    .sort(
      (a, b) =>
        (b.sample_size || 0) - (a.sample_size || 0) ||
        b.win_rate - a.win_rate
    )
    .slice(0, 6);
  const losing = (data.losing_patterns || []).slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
          Sales Leader · Floor Analytics
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-stewart-text">
          Floor-wide patterns
        </h1>
        <p className="text-sm text-stewart-muted mt-2 max-w-3xl">
          {stats.n_real_sales} engaged conversations · {macroPct}% macro
          close rate · {clusters.length} objection clusters identified.
        </p>
      </div>

      {/* Killer insight — Stewart-voice pattern callout from exec summary */}
      {data.executive_summary && (
        <StewartCallout kind="pattern">
          {data.executive_summary.split(/(?<=\.)\s+/)[0]}
        </StewartCallout>
      )}

      {/* Pipeline funnel */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-stewart-muted mb-3">
          Pipeline funnel
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Stat label="received" value={stats.n_received} />
          <Stat
            label="real conversations"
            value={stats.n_real_sales}
            sub={pct(stats.n_real_sales, stats.n_received)}
          />
          <Stat
            label="wins"
            value={stats.n_wins}
            sub={pct(stats.n_wins, stats.n_real_sales)}
            accent
          />
          <Stat
            label="engaged · no set"
            value={stats.n_engaged_noset}
            sub={pct(stats.n_engaged_noset, stats.n_real_sales)}
          />
          <Stat
            label="hard losses"
            value={stats.n_hard_losses}
            sub={pct(stats.n_hard_losses, stats.n_real_sales)}
            danger
          />
        </div>
      </section>

      {/* Objection cluster ranking */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-stewart-muted mb-3">
          Objection clusters by frequency
        </h2>
        <div className="rounded-lg border border-stewart-border bg-stewart-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-stewart-muted border-b border-stewart-border">
                <th className="px-4 py-2 font-normal">Cluster</th>
                <th className="px-4 py-2 font-normal text-right">Calls</th>
                <th className="px-4 py-2 font-normal text-right">Win rate</th>
                <th className="px-4 py-2 font-normal text-right">vs. floor</th>
                <th className="px-4 py-2 font-normal hidden md:table-cell">
                  Outcome breakdown
                </th>
              </tr>
            </thead>
            <tbody>
              {clusters.map((c) => (
                <ClusterRow
                  key={c.id}
                  cluster={c}
                  macroPct={macroPct}
                  isTop={c.id === topCluster?.id}
                  isWeakest={c.id === weakestCluster?.id}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-stewart-muted font-mono">
          <Legend swatch="bg-emerald-500" label="≥10 pts above floor" />
          <Legend swatch="bg-stewart-border" label="within 10 pts" />
          <Legend swatch="bg-rose-500" label="≥10 pts below floor" />
        </div>
      </section>

      {/* Top winning tracks + losing patterns */}
      <section className="grid lg:grid-cols-2 gap-5">
        <div>
          <h2 className="text-sm uppercase tracking-wider text-stewart-muted mb-3">
            Top winning word tracks
          </h2>
          <div className="space-y-2">
            {tracks.map((t) => (
              <WinningTrackRow key={t.id} track={t} />
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm uppercase tracking-wider text-stewart-muted mb-3">
            What&apos;s not working
          </h2>
          <div className="space-y-2">
            {losing.map((l, i) => (
              <LosingPatternRow key={`${l.cluster_id}-${i}`} losing={l} />
            ))}
          </div>
        </div>
      </section>

      {/* Deferred surfaces signal */}
      <StewartCallout kind="wip">
        Per-rep trend lines and manual curation surfaces (cluster
        promote/demote, canonical word-track marking) light up when the
        leader-dashboard endpoint ships.
      </StewartCallout>
    </div>
  );
}

function pct(n: number, d: number): string {
  if (!d) return "";
  return `${Math.round((n / d) * 100)}%`;
}

function Stat({
  label,
  value,
  sub,
  accent,
  danger,
}: {
  label: string;
  value: number;
  sub?: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-3 " +
        (accent
          ? "border-stewart-success/40 bg-stewart-success/5"
          : danger
          ? "border-stewart-danger/30 bg-stewart-danger/5"
          : "border-stewart-border bg-stewart-card")
      }
    >
      <div
        className={
          "text-2xl font-bold " +
          (accent
            ? "text-stewart-success"
            : danger
            ? "text-stewart-danger"
            : "text-stewart-text")
        }
      >
        {value}
      </div>
      <div className="text-xs text-stewart-muted mt-0.5">{label}</div>
      {sub && (
        <div className="text-[10px] text-stewart-muted/80 font-mono mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}

function ClusterRow({
  cluster,
  macroPct,
  isTop,
  isWeakest,
}: {
  cluster: Cluster;
  macroPct: number;
  isTop: boolean;
  isWeakest: boolean;
}) {
  const pct = Math.round(cluster.win_rate * 100);
  const lift = pct - macroPct;
  const liftTone =
    lift >= 10
      ? "text-stewart-success"
      : lift <= -10
      ? "text-stewart-danger"
      : "text-stewart-muted";
  const swatch =
    lift >= 10 ? "bg-emerald-500" : lift <= -10 ? "bg-rose-500" : "bg-stewart-border";
  const ob = cluster.outcome_breakdown || {};
  const breakdownEntries = Object.entries(ob).sort(([, a], [, b]) => b - a);
  return (
    <tr className="border-b border-stewart-border/70 last:border-b-0 hover:bg-stewart-bg/40">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`shrink-0 w-2 h-2 rounded-full ${swatch}`} />
          <div>
            <div className="font-medium text-stewart-text leading-tight">
              {cluster.name}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {isTop && (
                <span className="text-[9px] font-mono uppercase tracking-wide text-stewart-accent">
                  most frequent
                </span>
              )}
              {isWeakest && (
                <span className="text-[9px] font-mono uppercase tracking-wide text-stewart-warning">
                  weakest signal
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right font-mono text-stewart-text">
        {cluster.frequency}
      </td>
      <td className="px-4 py-3 text-right font-mono text-stewart-text">
        {pct}%
      </td>
      <td className={`px-4 py-3 text-right font-mono ${liftTone}`}>
        {lift > 0 ? "+" : ""}
        {lift}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {breakdownEntries.length === 0 ? (
            <span className="text-[10px] text-stewart-muted">—</span>
          ) : (
            breakdownEntries.map(([k, v]) => (
              <span
                key={k}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-stewart-border bg-stewart-bg text-stewart-muted"
              >
                {k.replace(/_/g, " ")}:{v}
              </span>
            ))
          )}
        </div>
      </td>
    </tr>
  );
}

function WinningTrackRow({ track }: { track: WordTrack }) {
  return (
    <article className="rounded-md border border-stewart-border bg-stewart-card p-3">
      <div className="flex items-baseline gap-2 text-[10px] font-mono text-stewart-muted">
        <span className="text-stewart-accent">#{track.rank}</span>
        <span>{track.cluster_id.replace(/_/g, " ")}</span>
        <span className="ml-auto">
          n={track.sample_size} · est. {Math.round(track.win_rate * 100)}%
        </span>
      </div>
      <p className="text-sm text-stewart-text italic mt-1.5 leading-snug">
        &ldquo;{truncate(track.verbatim, 140)}&rdquo;
      </p>
    </article>
  );
}

function LosingPatternRow({ losing }: { losing: LosingPattern }) {
  return (
    <article className="rounded-md border border-stewart-danger/30 bg-stewart-danger/5 p-3">
      <div className="flex items-center gap-2 text-[10px] font-mono text-stewart-muted">
        <span className="text-stewart-danger">✕</span>
        <span>{losing.cluster_id.replace(/_/g, " ")}</span>
        <span className="ml-auto">call {losing.source_call_id}</span>
      </div>
      <p className="text-sm text-stewart-text italic mt-1.5 leading-snug">
        &ldquo;{truncate(losing.verbatim, 130)}&rdquo;
      </p>
      <p className="text-[11px] text-stewart-muted mt-1.5 leading-snug">
        <span className="text-stewart-danger/90">why:</span>{" "}
        {truncate(losing.what_went_wrong, 140)}
      </p>
    </article>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${swatch}`} />
      {label}
    </span>
  );
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}
