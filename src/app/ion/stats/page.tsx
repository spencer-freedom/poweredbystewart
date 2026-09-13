import Link from "next/link";
import { SCRIPT_SECTIONS, loadCorpusStats } from "../present/_lib/corpus";

export const dynamic = "force-dynamic";

// /ion/stats — the corpus, counted. Everything on this page is read from
// public/ion/corpus-stats.json (written by the pipeline's finalize step);
// nothing is typed in. One hue for magnitude, text in text tokens, direct
// labels on every bar, a table for every chart.

const OUTCOME_ORDER = ["booked", "tentative", "callback", "no_appointment", "dq", "no_contact"];
const OUTCOME_LABEL: Record<string, string> = {
  booked: "Booked", tentative: "Tentative", callback: "Callback",
  no_appointment: "No appointment", dq: "Disqualified", no_contact: "No contact",
};
const SHAPE_ORDER = ["energy_built", "mixed", "energy_leaked", "stagnant"];
const SHAPE_LABEL: Record<string, string> = {
  energy_built: "Energy built", mixed: "Mixed", energy_leaked: "Energy leaked", stagnant: "Stagnant",
};
const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : "–");

export default async function IonStatsPage() {
  const s = await loadCorpusStats();
  if (!s) {
    return <main className="min-h-screen bg-stewart-bg text-stewart-text p-10">corpus-stats.json not found.</main>;
  }
  const outcomes = OUTCOME_ORDER.map((k) => ({ k, label: OUTCOME_LABEL[k], n: s.outcomes[k] ?? 0 }));
  const shapes = SHAPE_ORDER.map((k) => ({ k, label: SHAPE_LABEL[k], n: s.shapes[k] ?? 0 }));
  const otherShapes = Object.entries(s.shapes).filter(([k]) => !SHAPE_ORDER.includes(k)).reduce((a, [, v]) => a + v, 0);
  const coverage = SCRIPT_SECTIONS.map((sec) => ({ ...sec, ...(s.script_coverage[sec.key] ?? { asked: 0, skipped: 0, not_reached: 0, asked_rate: 0 }) }));
  const reps = Object.entries(s.reps)
    .filter(([name]) => name !== "Unknown")
    .map(([name, r]) => ({ name, ...r }))
    .sort((a, b) => b.calls - a.calls);
  const unknownReps = s.reps["Unknown"]?.calls ?? 0;
  const q = s.quotes;

  return (
    <main className="min-h-screen bg-stewart-bg text-stewart-text">
      <header className="sticky top-0 z-40 border-b border-stewart-border bg-stewart-card/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-stewart-accent">Stewart</span>
            <span className="text-stewart-muted text-xs">·</span>
            <span className="text-sm font-semibold">The corpus, counted</span>
          </div>
          <nav className="flex items-center gap-3 text-xs">
            <Link href="/ion/manager" className="text-stewart-muted hover:text-stewart-text">manager</Link>
            <Link href="/ion/calls" className="text-stewart-muted hover:text-stewart-text">calls</Link>
            <Link href="/ion/present" className="text-stewart-muted hover:text-stewart-text">← pitch</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* Headline tiles */}
        <section>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-3">
            {s.calls} calls read · {s.gated_out_voicemail_or_short} gated out as voicemail / too short · ${s.cost_usd.toFixed(2)} total
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Tile label="Bill captured → used" big={`${s.bill.flipped} of ${s.bill.captured}`} sub={`${pct(s.bill.flipped, s.bill.captured)} · ${s.bill.no_bill_captured} calls never got a bill`} warn />
            <Tile label="Reason given → used" big={`${s.interest_reason.used} of ${s.interest_reason.reason_given}`} sub={`asked on ${s.interest_reason.asked} of ${s.calls} calls (${pct(s.interest_reason.asked, s.calls)})`} warn />
            <Tile label="Booked" big={`${s.outcomes.booked ?? 0}`} sub={`${pct(s.outcomes.booked ?? 0, s.calls)} of calls · +${s.outcomes.tentative ?? 0} tentative`} />
            <Tile label="Quotes grounded" big={`${(q.grounded_rate * 100).toFixed(1)}%`} sub={`${q.checked.toLocaleString()} checked · ${q.not_found} not found · ${q.wrong_ts} wrong timestamp`} good />
          </div>
        </section>

        {/* Script coverage */}
        <section>
          <h2 className="text-lg font-bold">Did the rep run it?</h2>
          <p className="text-sm text-stewart-muted mt-1 mb-4">Share of {s.calls} calls where each section of Ion&apos;s setting script happened, in any phrasing. Hover a bar for skipped vs. not reached.</p>
          <Bars rows={coverage.map((c) => ({ label: c.label, value: c.asked, denom: s.calls, title: `asked ${c.asked} · skipped ${c.skipped} · not reached ${c.not_reached}` }))} />
          <details className="mt-3">
            <summary className="text-xs text-stewart-muted cursor-pointer hover:text-stewart-text">table</summary>
            <table className="mt-2 w-full text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-stewart-muted"><tr><th className="text-left py-1">Section</th><th className="text-right">Asked</th><th className="text-right">Skipped</th><th className="text-right">Not reached</th><th className="text-right">Rate</th></tr></thead>
              <tbody>{coverage.map((c) => (<tr key={c.key} className="border-t border-stewart-border/60"><td className="py-1">{c.label}</td><td className="text-right font-mono">{c.asked}</td><td className="text-right font-mono">{c.skipped}</td><td className="text-right font-mono">{c.not_reached}</td><td className="text-right font-mono">{pct(c.asked, s.calls)}</td></tr>))}</tbody>
            </table>
          </details>
        </section>

        {/* Outcomes + shapes */}
        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-bold">How the calls ended</h2>
            <p className="text-sm text-stewart-muted mt-1 mb-4">Stewart&apos;s structured outcome per call — the column that joins to Salesforce.</p>
            <Bars rows={outcomes.map((o) => ({ label: o.label, value: o.n, denom: s.calls, title: `${o.n} calls` }))} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Trajectory shape</h2>
            <p className="text-sm text-stewart-muted mt-1 mb-4">Did the rep build energy across the call, or lose it.{otherShapes ? ` (${otherShapes} off-enum, not shown)` : ""}</p>
            <Bars rows={shapes.map((o) => ({ label: o.label, value: o.n, denom: s.calls, title: `${o.n} calls` }))} />
          </div>
        </section>

        {/* Critic */}
        <section>
          <h2 className="text-lg font-bold">Stewart checks Stewart</h2>
          <p className="text-sm text-stewart-muted mt-1 mb-4">Critic verdict on the first draft, then a deterministic quote check on the draft that shipped.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <Tile label="Critic approved first draft" big={`${s.critic_verdicts.approved ?? 0}`} sub={`${s.critic_verdicts.revisions_required ?? 0} sent back for a revision`} />
            <Tile label="Calls with every quote grounded" big={`${q.calls_fully_grounded} of ${s.calls}`} sub="verified or near-verbatim, right timestamp" good />
            <Tile label="Quotes checked" big={q.checked.toLocaleString()} sub={`${q.verified.toLocaleString()} exact · ${q.fuzzy} near · ${q.wrong_ts} wrong ts · ${q.not_found} not found`} />
          </div>
        </section>

        {/* Reps */}
        <section>
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-bold">By rep</h2>
            <Link href="/ion/manager" className="text-xs text-stewart-accent hover:underline">script coverage by rep → manager / Floor</Link>
          </div>
          <p className="text-sm text-stewart-muted mt-1 mb-4">{reps.length} reps named on the tape{unknownReps ? `; ${unknownReps} calls where no rep introduced themselves` : ""}. Counts, not grades — small samples are small samples.</p>
          <div className="rounded-lg border border-stewart-border overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-stewart-card text-[10px] uppercase tracking-wider text-stewart-muted">
                <tr>
                  <th className="text-left px-3 py-2">Rep</th>
                  <th className="text-right px-3 py-2">Calls</th>
                  <th className="text-right px-3 py-2">Booked</th>
                  <th className="text-right px-3 py-2">Bill captured</th>
                  <th className="text-right px-3 py-2 text-stewart-warning">Bill used</th>
                  <th className="text-right px-3 py-2">Reason asked</th>
                  <th className="text-right px-3 py-2 text-stewart-warning">Reason used</th>
                </tr>
              </thead>
              <tbody>
                {reps.map((r) => (
                  <tr key={r.name} className="border-t border-stewart-border/60 hover:bg-stewart-card/60">
                    <td className="px-3 py-1.5 font-semibold">{r.name}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-stewart-muted">{r.calls}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{r.booked} <span className="text-stewart-muted text-xs">({pct(r.booked, r.calls)})</span></td>
                    <td className="px-3 py-1.5 text-right font-mono">{r.bill_captured} <span className="text-stewart-muted text-xs">({pct(r.bill_captured, r.calls)})</span></td>
                    <td className="px-3 py-1.5 text-right font-mono">{r.bill_flipped}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{r.reason_asked} <span className="text-stewart-muted text-xs">({pct(r.reason_asked, r.calls)})</span></td>
                    <td className="px-3 py-1.5 text-right font-mono">{r.reason_used}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-[11px] text-stewart-muted italic">
          Source: public/ion/corpus-stats.json, written by the pipeline&apos;s finalize step. Re-run the corpus and this page changes.
        </p>
      </div>
    </main>
  );
}

function Tile({ label, big, sub, warn, good }: { label: string; big: string; sub: string; warn?: boolean; good?: boolean }) {
  return (
    <div className="rounded-lg border border-stewart-border bg-stewart-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-stewart-muted">{label}</p>
      <p className={"mt-1 font-mono text-2xl sm:text-3xl font-bold leading-tight " + (warn ? "text-stewart-warning" : good ? "text-stewart-success" : "text-stewart-text")}>{big}</p>
      <p className="mt-1 text-xs text-stewart-muted leading-snug">{sub}</p>
    </div>
  );
}

// Horizontal bars: one hue, thin marks, direct labels, a table behind them.
function Bars({ rows }: { rows: { label: string; value: number; denom: number; title?: string }[] }) {
  const max = Math.max(...rows.map((r) => r.denom), 1);
  return (
    <ol className="space-y-2">
      {rows.map((r) => {
        const w = (100 * r.value) / max;
        return (
          <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_5.5rem] sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_5.5rem] items-center gap-3" title={r.title}>
            <span className="text-sm text-stewart-text leading-tight">{r.label}</span>
            <div className="hidden sm:block h-2.5 rounded-r bg-white/5 overflow-hidden">
              <div className="h-full rounded-r bg-stewart-accent/75" style={{ width: `${w}%` }} />
            </div>
            <span className="font-mono text-xs text-right text-stewart-text">
              {r.value} <span className="text-stewart-muted">· {pct(r.value, r.denom)}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
