import Link from "next/link";
import { AudioClip } from "../../(public)/_components/AudioClip.client";
import { Bridge } from "../_components/Bridge";
import { loadCallJson, loadCorpusStats } from "../_lib/corpus";

// One call, read all the way through — Carter's, the same call The Miss
// pulled three moments from. Rendered from the PUBLISHED read
// (public/ion/calls/20000555055-*.json), so it always matches what the
// manager surface and the call drawer show; nothing here is hand-copied.

const CALL_ID = "20000555055";
const REP = "Carter";
const CLIP_LEAD = 5;
const CLIP_LEN = 20;

type Brief = {
  trajectory_summary: string;
  shape: string;
  observed_outcome?: { outcome: string; ts: string | null; quote: string | null; reasoning: string } | null;
  bill_anchor_audit?: { bill_captured: boolean; bill_ts: string; flip_executed: string; reasoning: string } | null;
  interest_reason_audit?: { asked: boolean; ask_ts: string; reason_given: boolean; reason_quote: string | null; reason_used: string; reasoning: string } | null;
  primary_coaching_focus: { topic: string; ts: string; quote: string; why: string } | null;
  key_moments: { ts: string; quote: string; classification: string; stewart_read: string }[];
  quote_verification?: { checked: number; verified: number; fuzzy: number; wrong_ts: number; not_found: number } | null;
};
type Critic = { verdict?: string; revision_summary?: string; missed_moments?: number };
type Pick = { ts: string; quote: string; classification: string; derived_category?: string; stewart_read: string };

const SHAPE: Record<string, string> = {
  energy_built: "Energy built",
  energy_leaked: "Energy leaked",
  stagnant: "Stagnant",
  mixed: "Mixed",
};
const OUTCOME: Record<string, string> = {
  booked: "Booked",
  tentative: "Tentative",
  callback: "Callback",
  no_appointment: "No appointment",
  dq: "Disqualified",
  no_contact: "No contact",
};
// Server-side twin of AudioClip's tsToSeconds (that one lives in a client module).
const tsToSeconds = (ts: string) => {
  const [m, sec] = ts.split(":").map((x) => parseInt(x, 10) || 0);
  return (m || 0) * 60 + (sec || 0);
};
const humanize = (k: string) =>
  k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export async function SectionOneRead() {
  const [brief, picks, critic, stats] = await Promise.all([
    loadCallJson<Brief>(CALL_ID, "manager-brief"),
    loadCallJson<Pick[]>(CALL_ID, "cherrypicks"),
    loadCallJson<Critic>(CALL_ID, "critic-audit"),
    loadCorpusStats(),
  ]);
  if (!brief) return null;
  const moments = (picks ?? brief.key_moments).slice(0, 4);
  const o = brief.observed_outcome;
  const b = brief.bill_anchor_audit;
  const r = brief.interest_reason_audit;
  const q = brief.quote_verification;
  const cq = stats?.quotes;
  const firstSentence = (t?: string) => (t ?? "").split(/(?<=[.!?])\s/)[0];

  return (
    <section
      id="one-read"
      className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10 scroll-mt-20"
    >
      <div className="max-w-3xl w-full">
        <Bridge>
          You heard three moments from {REP}&apos;s call. Here&apos;s what Stewart
          handed his manager.
        </Bridge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          One call, read all the way through.
        </h2>

        <div className="mt-10 rounded-xl border border-stewart-border bg-stewart-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stewart-border px-5 py-4 sm:px-6">
            <span className="text-sm font-semibold text-stewart-text">
              {REP} &mdash; call {CALL_ID}
            </span>
            <div className="flex items-center gap-2">
              {o ? (
                <span className="text-[10px] uppercase tracking-wider font-mono rounded px-1.5 py-0.5 border text-stewart-warning border-stewart-warning/40">
                  {OUTCOME[o.outcome] ?? humanize(o.outcome)}
                </span>
              ) : null}
              <span className="text-[10px] uppercase tracking-wider font-mono rounded px-1.5 py-0.5 border text-stewart-muted border-stewart-border">
                {SHAPE[brief.shape] ?? humanize(brief.shape)}
              </span>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6 space-y-8">
            <Block label="The call, in one paragraph">
              <p className="text-base text-stewart-text leading-relaxed">{brief.trajectory_summary}</p>
            </Block>

            {o ? (
              <Block label="Stewart calls the outcome itself">
                <p className="text-base text-stewart-text leading-relaxed">
                  <span className="font-mono text-stewart-warning">{OUTCOME[o.outcome] ?? o.outcome}</span>
                  {o.ts ? <span className="font-mono text-sm text-stewart-muted"> @ {o.ts}</span> : null}
                  {o.quote ? <> &mdash; &ldquo;{o.quote}&rdquo;</> : null}
                </p>
                <p className="mt-1.5 text-sm text-stewart-muted leading-relaxed">{o.reasoning}</p>
              </Block>
            ) : null}

            {b || r ? (
              <Block label="The two anchors, measured on this call">
                <div className="grid sm:grid-cols-2 gap-4">
                  {b ? (
                    <Measured
                      title="The bill"
                      verdict={b.bill_captured ? (b.flip_executed === "yes" ? "captured and used" : "captured, never used") : "never captured"}
                      ts={b.bill_ts}
                      why={b.reasoning}
                      bad={b.bill_captured && b.flip_executed !== "yes"}
                    />
                  ) : null}
                  {r ? (
                    <Measured
                      title="The reason"
                      verdict={!r.asked ? "never asked" : !r.reason_given ? "asked, no reason given" : r.reason_used === "yes" ? "given and used" : "given, never used"}
                      ts={r.ask_ts}
                      why={r.reason_quote ? `“${r.reason_quote}” — ${r.reasoning}` : r.reasoning}
                      bad={!r.asked || (r.reason_given && r.reason_used !== "yes")}
                    />
                  ) : null}
                </div>
              </Block>
            ) : null}

            {brief.primary_coaching_focus ? (
              <Block label="Where to spend the one-on-one">
                <p className="text-lg font-bold text-stewart-text">
                  {brief.primary_coaching_focus.topic}{" "}
                  <span className="font-mono text-sm font-normal text-stewart-muted">{brief.primary_coaching_focus.ts}</span>
                </p>
                <p className="mt-2 text-base text-stewart-text leading-relaxed">{brief.primary_coaching_focus.why}</p>
              </Block>
            ) : null}

            <Block label="The moments, with the tape">
              <ol className="space-y-5">
                {moments.map((m) => {
                  const start = Math.max(0, tsToSeconds(m.ts) - CLIP_LEAD);
                  return (
                    <li key={m.ts + m.quote.slice(0, 12)} className="grid gap-2 sm:grid-cols-[4.5rem_1fr]">
                      <span className="font-mono text-sm text-stewart-accent pt-0.5">{m.ts}</span>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-stewart-accent">
                          {humanize((m as Pick).derived_category ?? m.classification)}
                        </p>
                        <p className="mt-1 text-base text-stewart-text">&ldquo;{m.quote}&rdquo;</p>
                        <p className="mt-1.5 text-sm text-stewart-muted leading-relaxed">{m.stewart_read}</p>
                        <div className="mt-2">
                          <AudioClip callId={CALL_ID} startSec={start} endSec={start + CLIP_LEN} label="Play the moment" />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Block>
          </div>
        </div>

        {/* Stewart checks Stewart — the critic on THIS call, then the code check on all of them. */}
        <div className="mt-8 rounded-xl border border-stewart-success/30 bg-stewart-success/5 p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-success mb-2">
            Then Stewart checks Stewart
          </p>
          {critic?.revision_summary ? (
            <p className="text-base text-stewart-text leading-relaxed">
              A second pass audits the reasoning. On this call it sent the first draft back
              {critic.missed_moments ? ` with ${critic.missed_moments} moment${critic.missed_moments === 1 ? "" : "s"} it had missed` : ""}
              : &ldquo;{firstSentence(critic.revision_summary)}&rdquo; The corrected read is what you just saw.
            </p>
          ) : (
            <p className="text-base text-stewart-text leading-relaxed">
              A second pass audits the reasoning on every call and sends the draft back when it finds a hole.
            </p>
          )}
          <p className="mt-3 text-base text-stewart-text leading-relaxed">
            Then every quoted line gets matched against the transcript &mdash; by code, no model.
            {q ? (
              <>
                {" "}This call: <span className="font-mono font-bold">{q.verified + q.fuzzy}</span> of{" "}
                <span className="font-mono font-bold">{q.checked}</span> quotes found.
              </>
            ) : null}
            {cq ? (
              <>
                {" "}Across all {stats?.calls} reads:{" "}
                <span className="font-mono font-bold">{cq.checked.toLocaleString()}</span> quotes checked,{" "}
                <span className="font-mono font-bold text-stewart-success">{(cq.grounded_rate * 100).toFixed(1)}%</span>{" "}
                found word-for-word or near it, <span className="font-mono font-bold">{cq.wrong_ts}</span> at the wrong
                timestamp, <span className="font-mono font-bold">{cq.not_found}</span> not found. Those get flagged, not shown.
              </>
            ) : null}
          </p>
        </div>

        {/* The transcript can be wrong too — and this call proved it. Ties to
            /ion/listen so anyone can hear the two moments themselves. */}
        <div className="mt-6 rounded-xl border border-stewart-border bg-stewart-card p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-muted mb-2">
            And sometimes the transcript is the one that&apos;s wrong
          </p>
          <p className="text-base text-stewart-text leading-relaxed">
            An earlier read of this call coached {REP} for answering his own title and credit
            questions &mdash; the transcript shows &ldquo;No.&rdquo; at 01:15 and &ldquo;Yes.&rdquo; at
            02:24 on his track. We pulled the two clips. Lorenzo says both. The transcript had put
            a one-word answer on the wrong speaker, and the read you just saw didn&apos;t take the
            bait. A coaching tool that will admit the transcript can be wrong is the one you can
            trust with your reps.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AudioClip callId={CALL_ID} startSec={64} endSec={80} label="01:09 — the title question" />
            <AudioClip callId={CALL_ID} startSec={130} endSec={150} label="02:15 — the credit question" />
          </div>
        </div>

        <p className="mt-8 text-sm text-stewart-muted">
          Every one of the {stats?.calls ?? 300} has this.{" "}
          <Link href="/ion/calls" className="text-stewart-accent hover:underline">
            Browse them &rarr;
          </Link>
        </p>
      </div>
    </section>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-stewart-muted mb-2">{label}</p>
      {children}
    </div>
  );
}

function Measured({ title, verdict, ts, why, bad }: { title: string; verdict: string; ts?: string | null; why: string; bad: boolean }) {
  return (
    <div className={"rounded-lg border p-4 " + (bad ? "border-stewart-warning/40 bg-stewart-warning/5" : "border-stewart-success/40 bg-stewart-success/5")}>
      <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-stewart-muted">{title}</p>
      <p className={"mt-1 text-base font-bold " + (bad ? "text-stewart-warning" : "text-stewart-success")}>
        {verdict}
        {ts ? <span className="font-mono text-sm font-normal text-stewart-muted"> @ {ts}</span> : null}
      </p>
      <p className="mt-1.5 text-sm text-stewart-muted leading-relaxed">{why}</p>
    </div>
  );
}
