import Link from "next/link";
import { fetchDecisionTree, type WordTrack } from "@/lib/ion-api";
import { ErrorPanel } from "../../_components/error-panel";
import { AudioClip } from "../../_components/audio-clip";

export const dynamic = "force-dynamic";

export default async function ClusterDetailPage({
  params,
}: {
  params: Promise<{ token: string; clusterId: string }>;
}) {
  const { token, clusterId } = await params;
  try {
    const data = await fetchDecisionTree(token);
    const cluster = (data.clusters || []).find((c) => c.id === clusterId);
    if (!cluster) {
      return (
        <ErrorPanel error={`Cluster "${clusterId}" not found in this tree.`} />
      );
    }

    const tracks = (data.word_tracks || [])
      .filter((t) => t.cluster_id === clusterId)
      .sort((a, b) => a.rank - b.rank);
    const tracksById = new Map<string, WordTrack>(
      (data.word_tracks || []).map((t) => [t.id, t])
    );
    const trackIdsInCluster = new Set(tracks.map((t) => t.id));
    const transitions = (data.transitions || []).filter((tr) =>
      trackIdsInCluster.has(tr.parent_track_id)
    );
    const losingPatterns = (data.losing_patterns || []).filter(
      (l) => l.cluster_id === clusterId
    );

    return (
      <div className="space-y-8">
        <div>
          <Link
            href={`/ion/k/${token}/tree`}
            className="text-xs text-stewart-muted hover:text-stewart-accent"
          >
            ← All clusters
          </Link>
          <h1 className="text-2xl font-bold text-stewart-text mt-2">
            {cluster.name}
          </h1>
          <p className="text-stewart-muted mt-2 max-w-3xl">
            {cluster.description}
          </p>
          {/* Outcome breakdown — prominent */}
          {(() => {
            const ob = cluster.outcome_breakdown || {};
            const winKeys = ["booked", "tentative_appointment", "transferred_to_closer"];
            const lossKeys = ["declined", "no_interest", "unqualified"];
            const totalCalls = Object.values(ob).reduce((s, n) => s + n, 0) || cluster.frequency;
            const totalWins = Object.entries(ob).filter(([k]) => winKeys.includes(k)).reduce((s, [, n]) => s + n, 0);
            const totalLosses = Object.entries(ob).filter(([k]) => lossKeys.includes(k)).reduce((s, [, n]) => s + n, 0);
            const totalEngaged = totalCalls - totalWins - totalLosses;
            const winPct = totalCalls > 0 ? Math.round((totalWins / totalCalls) * 100) : 0;
            const macroPct = data.macro_win_rate != null ? Math.round(data.macro_win_rate * 100) : null;
            const lift = macroPct != null ? winPct - macroPct : null;

            return (
              <div className="mt-4 bg-stewart-card border border-stewart-border rounded-lg p-4">
                <div className="flex items-baseline gap-6 flex-wrap">
                  <div>
                    <span className="text-3xl font-bold text-stewart-text">{totalCalls}</span>
                    <span className="text-sm text-stewart-muted ml-2">calls</span>
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-green-400">{totalWins}</span>
                    <span className="text-sm text-green-400 ml-2">won ({winPct}%)</span>
                  </div>
                  {totalLosses > 0 && (
                    <div>
                      <span className="text-3xl font-bold text-red-400">{totalLosses}</span>
                      <span className="text-sm text-red-400 ml-2">lost</span>
                    </div>
                  )}
                  {totalEngaged > 0 && (
                    <div>
                      <span className="text-3xl font-bold text-yellow-400">{totalEngaged}</span>
                      <span className="text-sm text-yellow-400 ml-2">engaged / callback</span>
                    </div>
                  )}
                  {lift != null && (
                    <div className="ml-auto">
                      <span className={`text-sm font-mono ${lift > 0 ? "text-green-400" : lift < 0 ? "text-red-400" : "text-stewart-muted"}`}>
                        {lift > 0 ? "+" : ""}{lift} pts vs. {macroPct}% macro
                      </span>
                    </div>
                  )}
                </div>

                {Object.keys(ob).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-stewart-border flex flex-wrap gap-3 text-xs">
                    {Object.entries(ob)
                      .sort(([, a], [, b]) => b - a)
                      .map(([outcome, count]) => {
                        const isWin = winKeys.includes(outcome);
                        const isLoss = lossKeys.includes(outcome);
                        const color = isWin ? "bg-green-900/30 border-green-700 text-green-400"
                          : isLoss ? "bg-red-900/30 border-red-700 text-red-400"
                          : "bg-yellow-900/30 border-yellow-700 text-yellow-400";
                        return (
                          <span key={outcome} className={`px-2 py-1 rounded border font-mono ${color}`}>
                            {outcome.replace(/_/g, " ")}: {count}
                          </span>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="mt-3 text-sm text-stewart-muted">
            <strong>{tracks.length}</strong> winning word tracks · <strong>{losingPatterns.length}</strong> losing patterns
          </div>
        </div>

        <section>
          <h2 className="text-sm uppercase tracking-wider text-stewart-muted mb-3">
            Winning word tracks
          </h2>
          <div className="space-y-4">
            {tracks.length === 0 && (
              <p className="text-stewart-muted text-sm">
                No winning word tracks extracted for this cluster yet.
              </p>
            )}
            {tracks.map((w) => (
              <div
                key={w.id}
                className="bg-stewart-card border border-stewart-border rounded-lg p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-stewart-accent border border-stewart-accent/30 rounded px-2 py-1 mt-1 whitespace-nowrap">
                    #{w.rank}
                  </span>
                  <blockquote className="flex-1 text-stewart-text italic leading-relaxed">
                    &ldquo;{w.verbatim}&rdquo;
                  </blockquote>
                </div>

                <p className="text-sm text-stewart-muted mt-3 leading-relaxed">
                  <strong className="text-stewart-text">Why it works:</strong>{" "}
                  {w.why_it_works}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-stewart-muted">
                  <span>
                    From call <code>{w.source_call_id}</code>
                  </span>
                  {w.source_setter_id && (
                    <span>
                      rep <code>{w.source_setter_id}</code>
                    </span>
                  )}
                  <span>
                    {w.sample_size} example{w.sample_size === 1 ? "" : "s"}
                  </span>
                  <span>est. {Math.round(w.win_rate * 100)}% win</span>
                </div>

                {typeof w.start_seconds === "number" &&
                typeof w.end_seconds === "number" &&
                w.end_seconds > w.start_seconds ? (
                  <div className="mt-4">
                    <AudioClip
                      token={token}
                      callId={w.source_call_id}
                      startSec={w.start_seconds}
                      endSec={w.end_seconds}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-stewart-muted mt-4 italic">
                    Audio clip unavailable for this line.
                  </p>
                )}

                {/* Audio examples gallery — other calls that used this track */}
                {w.audio_examples && w.audio_examples.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-stewart-border">
                    <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
                      {w.audio_examples.length} example{w.audio_examples.length === 1 ? "" : "s"} of this track across calls
                    </p>
                    <div className="space-y-2">
                      {w.audio_examples.map((ex, idx) => {
                        const isWin = ["booked", "tentative_appointment", "transferred_to_closer"].includes(ex.outcome);
                        const isLoss = ["declined", "no_interest", "unqualified"].includes(ex.outcome);
                        const outcomeColor = isWin ? "text-green-400" : isLoss ? "text-red-400" : "text-yellow-400";
                        const hasAudio = typeof ex.start_seconds === "number" && typeof ex.end_seconds === "number" && ex.end_seconds > ex.start_seconds;
                        return (
                          <div key={idx} className="flex items-center gap-3 text-xs bg-stewart-bg rounded px-3 py-2">
                            <span className={`font-mono font-bold ${outcomeColor}`}>
                              {ex.outcome?.replace(/_/g, " ") || "unknown"}
                            </span>
                            <span className="text-stewart-muted">
                              call <code>{ex.call_id}</code>
                            </span>
                            {ex.outcome_observed && (
                              <span className="text-stewart-muted">
                                attempt result: {ex.outcome_observed}
                              </span>
                            )}
                            {hasAudio && (
                              <AudioClip
                                token={token}
                                callId={ex.call_id}
                                startSec={ex.start_seconds!}
                                endSec={ex.end_seconds!}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {losingPatterns.length > 0 && (
          <section>
            <h2 className="text-sm uppercase tracking-wider text-stewart-muted mb-3">
              What didn&apos;t work — losing patterns
            </h2>
            <p className="text-xs text-stewart-muted mb-3 max-w-3xl">
              Verbatim lines from calls in this cluster that ended without an
              appointment. The contrast against the winning tracks above is the
              training signal.
            </p>
            <div className="space-y-3">
              {losingPatterns.map((l, i) => (
                <div
                  key={i}
                  className="border border-stewart-danger/30 bg-stewart-danger/5 rounded-lg p-4"
                >
                  <blockquote className="text-stewart-text italic">
                    &ldquo;{l.verbatim}&rdquo;
                  </blockquote>
                  <p className="text-sm text-stewart-muted mt-2">
                    <strong className="text-stewart-text">
                      What went wrong:
                    </strong>{" "}
                    {l.what_went_wrong}
                  </p>
                  <p className="text-xs text-stewart-muted mt-2">
                    From call <code>{l.source_call_id}</code>
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {transitions.length > 0 && (
          <section>
            <h2 className="text-sm uppercase tracking-wider text-stewart-muted mb-3">
              Observed attempt-1 → attempt-2 transitions
            </h2>
            <div className="space-y-2">
              {transitions.map((t, i) => {
                const parent = tracksById.get(t.parent_track_id);
                const next = t.next_track_id
                  ? tracksById.get(t.next_track_id)
                  : null;
                return (
                  <div
                    key={i}
                    className="border border-stewart-border bg-stewart-card rounded p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="text-stewart-muted">
                        {parent ? `#${parent.rank}` : t.parent_track_id} →{" "}
                        {next ? `#${next.rank}` : t.next_track_id || "(no follow-up)"}
                      </span>
                      <span
                        className={
                          t.condition === "failed"
                            ? "text-stewart-danger"
                            : t.condition === "partial"
                            ? "text-stewart-warning"
                            : "text-stewart-success"
                        }
                      >
                        {t.condition}
                      </span>
                      <span className="text-stewart-muted">
                        × {t.sample_size}
                      </span>
                      {t.transition_rate != null && (
                        <span className="text-stewart-muted">
                          {Math.round(t.transition_rate * 100)}% rate
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stewart-text mt-2">{t.note}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  } catch (e) {
    return <ErrorPanel error={e instanceof Error ? e.message : String(e)} />;
  }
}
