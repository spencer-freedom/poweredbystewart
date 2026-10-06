"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AltTake } from "../(public)/_components/AltTake.client";
import { AudioClip } from "../(public)/_components/AudioClip.client";
import { SHOWCASE } from "./showcase";

// One call, taken apart. The whole call plays at the top; everything Stewart
// read is a node on the atom below; clicking a node seeks the player to that
// second and opens what was said. Beside each objection: what the rep did,
// and what works on this floor for that objection. For the moment the rep
// conceded, the line he could have said, rendered in his own voice.

export type Event = {
  section: string; status: string; ts: string; end_ts?: string; quote?: string;
  customer_response?: string; customer_quote?: string; resistance_reason?: string; rep_followup?: string; result?: string;
  parts_score?: string; parts_done?: string[];
};
export type Objection = {
  ts: string; quote: string; type: string; blocked_section?: string; rep_attempts: number; rep_restates?: number;
  attempt_quotes?: string[]; attempt_moves?: string[]; attempt_kinds?: string[]; resolved: boolean; resolved_by_tape?: boolean; next_event?: string | null; reasoning?: string;
};
export type CallRead = {
  callId: string;
  rep: string | null;
  durationMin: number | null;
  corpusCalls: number;
  brief: {
    rep_name?: string | null;
    trajectory_summary?: string;
    shape?: string;
    observed_outcome?: { outcome: string; ts?: string | null; quote?: string | null; reasoning?: string; set_strength?: string | null; set_conditions?: Record<string, unknown> } | null;
    bill_anchor_audit?: { bill_captured: boolean; bill_ts?: string; bill_quote?: string | null; flip_executed?: string; reasoning?: string } | null;
    bill_document_audit?: { asked: boolean; ask_ts?: string; ask_quote?: string | null; result?: string; method?: string; result_ts?: string; result_quote?: string | null; reasoning?: string } | null;
    interest_reason_audit?: { asked: boolean; ask_ts?: string; reason_given: boolean; reason_ts?: string; reason_quote?: string | null; reason_used?: string; use_ts?: string; use_quote?: string | null; reasoning?: string } | null;
    script_coverage?: Event[];
    objections?: Objection[];
    primary_coaching_focus?: { topic: string; ts: string; quote: string; why: string } | null;
  };
  picks: { ts: string; quote: string; classification: string; stewart_read: string; coaching_implication?: string }[];
  quotes: { checked: number; verified: number; fuzzy: number; wrong_ts: number; not_found: number } | null;
};
export type FloorMoves = {
  byType: Record<string, Record<string, { used: number; set: number; continued: number }>>;
  all: Record<string, { used: number; set: number; continued: number }>;
  byAngles: Record<string, { set: number; n: number; set_rate: number | null }>;
};

const SECTION_LABEL: Record<string, string> = {
  intro_legitimacy: "Intro", interest_question: "Why solar?", address_homeowner: "Address & owner", co_owner: "Co-owner",
  roof: "Roof", utility_company: "Utility", bill_amount: "Bill amount", tax_credit_qualifier: "Credit / tax", military: "Military",
  prior_design: "Prior design", bill_collection: "Get the bill", appointment_set: "Appointment", button_up: "Button-up",
};
const OBJ_LABEL: Record<string, string> = {
  cost: "Cost", timing_or_callback: "Not now / call back", trust_or_scam: "Trust", spouse_or_co_decider: "Needs the spouse",
  already_have_quote_or_system: "Already has a quote", not_interested: "Not interested", roof_or_home: "Roof / home", proposal_by_email: "Email me something", other: "Other",
};
const MOVE_LABEL: Record<string, string> = {
  reason: "gave a reason", reframe: "reframed it", question_back: "asked a question back", alternative_offered: "offered an alternative",
  reassure: "reassured", social_proof: "social proof", redirect_to_specialist: "sent it to the specialist", concede: "conceded", restate: "said it again", other: "other",
};
const OUTCOME_LABEL: Record<string, string> = { booked: "Booked", tentative: "Tentative", callback: "Callback", no_appointment: "No appointment", dq: "Disqualified", no_contact: "No contact" };


const sec = (ts?: string | null) => { if (!ts) return null; const [m, s] = ts.split(":").map((x) => parseInt(x, 10) || 0); return (m || 0) * 60 + (s || 0); };
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

type Node = { id: string; kind: "section" | "objection" | "audit" | "outcome" | "focus"; label: string; ts: string | null; angle: number; r: number; tone: string; data: unknown };

export type Tab = { callId: string; rep: string | null; durationMin: number | null; outcome: string | null; hook: string };

export function CallAtom({ read, floor, tabs }: { read: CallRead; floor: FloorMoves; tabs: Tab[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const b = read.brief;
  const events = b.script_coverage ?? [];
  const objections = b.objections ?? [];
  const outcome = b.observed_outcome ?? null;
  const dur = read.durationMin ? read.durationMin * 60 : Math.max(...events.map((e) => sec(e.end_ts || e.ts) ?? 0), ...objections.map((o) => sec(o.ts) ?? 0)) + 30;

  const nodes = useMemo<Node[]>(() => {
    const out: Node[] = [];
    const n = events.length || 13;
    events.forEach((e, i) => {
      const angle = -90 + (360 / n) * i;
      out.push({ id: `s:${e.section}`, kind: "section", label: SECTION_LABEL[e.section] ?? e.section, ts: e.ts || null, angle, r: 150,
        tone: e.status === "asked" ? (e.result === "completed" ? "#3b82f6" : "#f59e0b") : e.status === "skipped" ? "#ef4444" : "#374151", data: e });
    });
    objections.forEach((o, i) => {
      const blocked = events.findIndex((e) => e.section === o.blocked_section);
      const angle = blocked >= 0 ? -90 + (360 / n) * blocked + 12 * (i + 1) : -90 + (360 / Math.max(objections.length, 1)) * i;
      out.push({ id: `o:${i}`, kind: "objection", label: OBJ_LABEL[o.type] ?? o.type, ts: o.ts, angle, r: 250, tone: o.resolved_by_tape ? "#f59e0b" : "#ef4444", data: o });
    });
    const audits: [string, string, string | null, unknown, string][] = [];
    if (b.bill_anchor_audit?.bill_captured) audits.push(["a:bill", "Bill amount", b.bill_anchor_audit.bill_ts ?? null, b.bill_anchor_audit, b.bill_anchor_audit.flip_executed === "yes" ? "#22c55e" : "#f59e0b"]);
    if (b.bill_document_audit?.asked) audits.push(["a:doc", `Bill: ${(b.bill_document_audit.result ?? "").replace(/_/g, " ")}`, b.bill_document_audit.result_ts || b.bill_document_audit.ask_ts || null, b.bill_document_audit, b.bill_document_audit.result === "received_on_call" ? "#22c55e" : "#f59e0b"]);
    if (b.interest_reason_audit?.reason_given) audits.push(["a:reason", "The reason", b.interest_reason_audit.reason_ts ?? null, b.interest_reason_audit, b.interest_reason_audit.reason_used === "yes" ? "#22c55e" : "#f59e0b"]);
    // Outer-ring nodes that aren't tied to a section take the freest angles,
    // so labels never pile up on one side.
    const used = () => out.filter((n) => n.r === 250).map((n) => ((n.angle % 360) + 360) % 360);
    const dist = (a: number, b2: number) => { const d = Math.abs(a - b2) % 360; return Math.min(d, 360 - d); };
    const freest = () => {
      const u = used();
      let best = 0, bestD = -1;
      for (let a = 0; a < 360; a += 15) {
        const d = u.length ? Math.min(...u.map((x) => dist(a, x))) : 999;
        if (d > bestD) { bestD = d; best = a; }
      }
      return best;
    };
    if (outcome) out.push({ id: "x:outcome", kind: "outcome", label: OUTCOME_LABEL[outcome.outcome] ?? outcome.outcome, ts: outcome.ts ?? null, angle: freest(), r: 250, tone: outcome.outcome === "booked" ? "#22c55e" : outcome.outcome === "tentative" ? "#f59e0b" : "#9ca3af", data: outcome });
    audits.forEach(([id, label, ts, data, tone]) => out.push({ id, kind: "audit", label, ts, angle: freest(), r: 250, tone, data }));
    if (b.primary_coaching_focus) out.push({ id: "x:focus", kind: "focus", label: "Where to coach", ts: b.primary_coaching_focus.ts, angle: freest(), r: 250, tone: "#a78bfa", data: b.primary_coaching_focus });
    return out;
  }, [events, objections, b, outcome]);

  const seek = (ts: string | null) => {
    const s = sec(ts);
    if (s === null || !audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, s - 3);
    void audioRef.current.play().catch(() => {});
  };
  const pick = (n: Node) => { setSelected(n.id); seek(n.ts); };
  const sel = nodes.find((n) => n.id === selected) ?? null;
  const show = SHOWCASE[read.callId] ?? null;
  const missObj = show?.miss.kind === "objection" ? objections.find((o) => o.ts === show.miss.ts) ?? null : null;
  const missPick = show ? read.picks.find((pk) => pk.ts === show.miss.ts) ?? null : null;
  const missSec = show ? sec(show.miss.ts) ?? 0 : 0;
  const winSec = show ? sec(show.win.ts) ?? 0 : 0;

  const pos = (n: Node) => { const a = (n.angle * Math.PI) / 180; return { x: Math.cos(a) * n.r, y: Math.sin(a) * n.r }; };

  return (
    <main className="min-h-screen bg-black text-stewart-text">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-xs uppercase tracking-[0.25em] text-stewart-accent font-semibold">Powered by Stewart &middot; three calls, taken apart</p>
        {tabs.length > 1 ? (
          <div className="mt-4 grid sm:grid-cols-3 gap-2">
            {tabs.map((t) => {
              const active = t.callId === read.callId;
              return (
                <Link key={t.callId} href={`/ion/call?id=${encodeURIComponent(t.callId)}`} className={"rounded-lg border p-3 transition-colors " + (active ? "border-stewart-accent/60 bg-stewart-accent/10" : "border-stewart-border bg-stewart-card hover:border-stewart-accent/40")}>
                  <p className="text-sm font-semibold">{t.rep ?? "?"} <span className="text-stewart-muted font-normal">&middot; {t.durationMin ? `${t.durationMin.toFixed(1)} min` : ""} &middot; {t.outcome ? OUTCOME_LABEL[t.outcome] ?? t.outcome : ""}</span></p>
                  <p className="mt-1 text-xs text-stewart-muted leading-snug">{t.hook}</p>
                </Link>
              );
            })}
          </div>
        ) : null}
        <h1 className="mt-6 text-3xl sm:text-5xl font-bold leading-tight">{read.rep ?? "A rep"} &middot; {read.durationMin ? `${read.durationMin.toFixed(1)} min` : ""} &middot; {outcome ? OUTCOME_LABEL[outcome.outcome] ?? outcome.outcome : ""}{outcome?.set_strength === "set_with_bill" ? ", bill in hand" : ""}</h1>
        <p className="mt-3 max-w-2xl text-stewart-muted leading-relaxed">Listen to the whole call. Then click anything on the atom to hear the second Stewart is talking about. Every quote on this page was matched to the transcript by code{read.quotes ? `: ${read.quotes.verified + read.quotes.fuzzy} of ${read.quotes.checked} found` : ""}.</p>

        {/* The whole call, with a timeline of what Stewart found */}
        <div className="mt-8 rounded-xl border border-stewart-border bg-stewart-card p-4">
          <audio ref={audioRef} controls preload="metadata" className="w-full" src={`/api/ion/audio-clip/${encodeURIComponent(read.callId)}`} />
          <div className="relative mt-3 h-8">
            <div className="absolute inset-x-0 top-3 h-1 rounded bg-white/10" />
            {nodes.filter((n) => n.ts).map((n) => {
              const left = Math.min(100, Math.max(0, ((sec(n.ts) ?? 0) / dur) * 100));
              return (
                <button key={n.id} type="button" title={`${n.label} ${n.ts}`} onClick={() => pick(n)}
                  className="absolute -translate-x-1/2 rounded-full border border-black"
                  style={{ left: `${left}%`, top: n.kind === "section" ? 8 : 2, width: n.kind === "section" ? 10 : 14, height: n.kind === "section" ? 10 : 14, background: n.tone }} />
              );
            })}
          </div>
          <p className="text-[11px] text-stewart-muted">Small dots: the script, in order. Large dots: objections, the bill, the reason, the outcome. Click to jump.</p>
        </div>

        <div className="mt-8 grid lg:grid-cols-[1fr_22rem] gap-6 items-start">
          {/* The atom */}
          <div className="rounded-xl border border-stewart-border bg-stewart-card p-2">
            <svg viewBox="-390 -310 780 620" className="w-full h-auto">
              {/* bonds: objection → the section it blocked */}
              {nodes.filter((n) => n.kind === "objection").map((n) => {
                const o = n.data as Objection; const t = nodes.find((m) => m.id === `s:${o.blocked_section}`); if (!t) return null;
                const a = pos(n), c = pos(t);
                return <line key={n.id + "b"} x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={n.tone} strokeOpacity={0.5} strokeWidth={2} strokeDasharray={o.resolved_by_tape ? undefined : "4 4"} />;
              })}
              {/* script ring */}
              <circle r={150} fill="none" stroke="#ffffff" strokeOpacity={0.08} />
              {nodes.filter((n) => n.kind === "section").map((n, i, arr) => {
                const a = pos(n); const next = arr[(i + 1) % arr.length]; const bpos = pos(next);
                return <line key={n.id + "r"} x1={a.x} y1={a.y} x2={bpos.x} y2={bpos.y} stroke="#3b82f6" strokeOpacity={(n.data as Event).status === "asked" && (next.data as Event).status === "asked" ? 0.35 : 0.08} strokeWidth={1.5} />;
              })}
              {/* nucleus */}
              <circle r={54} fill="#0b1220" stroke="#3b82f6" strokeOpacity={0.6} />
              <text textAnchor="middle" y={-6} fill="#e5e7eb" fontSize={14} fontWeight={700}>{read.rep ?? "call"}</text>
              <text textAnchor="middle" y={12} fill="#9ca3af" fontSize={10}>{events.filter((e) => e.status === "asked").length} of {events.length} sections</text>
              <text textAnchor="middle" y={26} fill="#9ca3af" fontSize={10}>{objections.length} objection{objections.length === 1 ? "" : "s"}</text>
              {/* nodes */}
              {nodes.map((n) => {
                const p = pos(n); const active = selected === n.id; const big = n.kind !== "section";
                const e = n.data as Event;
                const filled = n.kind !== "section" || e.status === "asked";
                return (
                  <g key={n.id} transform={`translate(${p.x} ${p.y})`} onClick={() => pick(n)} style={{ cursor: "pointer" }}>
                    <circle r={active ? (big ? 16 : 11) : big ? 12 : 8} fill={filled ? n.tone : "#000"} stroke={n.tone} strokeWidth={active ? 3 : 1.5} fillOpacity={filled ? 0.9 : 1} />
                    {n.kind === "objection" ? <text textAnchor="middle" y={4} fill="#000" fontSize={10} fontWeight={700}>{(n.data as Objection).rep_attempts}</text> : null}
                    <text textAnchor={p.x > 20 ? "start" : p.x < -20 ? "end" : "middle"} x={p.x > 20 ? 16 : p.x < -20 ? -16 : 0} y={p.x > 20 || p.x < -20 ? 4 : p.y > 0 ? 24 : -16} fill={active ? "#e5e7eb" : "#9ca3af"} fontSize={11}>{n.label}{n.ts ? ` ${n.ts}` : ""}</text>
                  </g>
                );
              })}
            </svg>
            <div className="px-3 pb-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stewart-muted">
              <span><span className="inline-block w-2 h-2 rounded-full bg-[#3b82f6] mr-1" />ran it</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-[#f59e0b] mr-1" />ran it, partial / objection the script got past</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-[#ef4444] mr-1" />skipped / objection that stopped it</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-[#374151] mr-1" />never reached</span>
              <span>number on an objection = angles tried</span>
            </div>
          </div>

          {/* The detail card */}
          <div className="rounded-xl border border-stewart-border bg-stewart-card p-4 min-h-[16rem]">
            {!sel ? (
              <>
                <p className="text-[11px] uppercase tracking-wider text-stewart-muted">The call in one paragraph</p>
                <p className="mt-2 text-sm leading-relaxed">{b.trajectory_summary}</p>
                {b.primary_coaching_focus ? (
                  <>
                    <p className="mt-4 text-[11px] uppercase tracking-wider text-stewart-muted">Where to spend the one-on-one</p>
                    <p className="mt-1 text-sm font-semibold">{b.primary_coaching_focus.topic} <span className="font-mono text-xs text-stewart-muted">{b.primary_coaching_focus.ts}</span></p>
                    <p className="mt-1 text-xs text-stewart-muted leading-relaxed">{b.primary_coaching_focus.why}</p>
                  </>
                ) : null}
                <p className="mt-4 text-xs text-stewart-muted">Click a node.</p>
              </>
            ) : sel.kind === "section" ? (
              <SectionCard e={sel.data as Event} callId={read.callId} />
            ) : sel.kind === "objection" ? (
              <ObjectionCard o={sel.data as Objection} callId={read.callId} floor={floor} corpusCalls={read.corpusCalls} />
            ) : sel.kind === "audit" ? (
              <AuditCard id={sel.id} data={sel.data} callId={read.callId} />
            ) : sel.kind === "outcome" ? (
              <GenericCard title={sel.label} ts={(sel.data as { ts?: string | null }).ts ?? null} quote={(sel.data as { quote?: string | null }).quote ?? null} body={(sel.data as { reasoning?: string }).reasoning ?? ""} callId={read.callId} />
            ) : (
              <GenericCard title={(sel.data as { topic: string }).topic} ts={(sel.data as { ts: string }).ts} quote={(sel.data as { quote: string }).quote} body={(sel.data as { why: string }).why} callId={read.callId} />
            )}
          </div>
        </div>

        {show && read.rep ? (
          <>
            <div className="mt-8 rounded-xl border border-stewart-success/40 bg-stewart-success/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stewart-success">What he got right</p>
              <h2 className="mt-2 text-xl sm:text-2xl font-bold">{show.win.title}</h2>
              <p className="mt-2 text-sm text-stewart-muted leading-relaxed">{show.win.why}</p>
              <div className="mt-3"><AudioClip callId={read.callId} startSec={Math.max(0, winSec - 4)} endSec={winSec + 26} label={`Play ${show.win.ts}`} /></div>
            </div>

            <div className="mt-6 rounded-xl border border-stewart-accent/40 bg-stewart-accent/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stewart-accent">The moment the one-on-one is about</p>
              <h2 className="mt-2 text-xl sm:text-2xl font-bold">{show.miss.title}</h2>
              <p className="mt-2 text-sm text-stewart-muted leading-relaxed">{show.miss.why}</p>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-stewart-border bg-stewart-bg/60 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-stewart-muted">What {read.rep} said</p>
                  {missObj ? (
                    <>
                      <p className="mt-1 text-sm">customer: &ldquo;{missObj.quote}&rdquo;</p>
                      {missObj.attempt_quotes?.map((q, i) => <p key={i} className="mt-1 text-sm">{read.rep}: &ldquo;{q}&rdquo; <span className="text-xs text-stewart-muted">({MOVE_LABEL[missObj.attempt_moves?.[i] ?? ""] ?? ""})</span></p>)}
                    </>
                  ) : missPick ? (
                    <>
                      <p className="mt-1 text-sm">&ldquo;{missPick.quote}&rdquo; <span className="font-mono text-xs text-stewart-muted">{missPick.ts}</span></p>
                      <p className="mt-1 text-xs text-stewart-muted leading-relaxed">{missPick.stewart_read}</p>
                    </>
                  ) : null}
                  <div className="mt-3"><AudioClip callId={read.callId} startSec={Math.max(0, missSec - 4)} endSec={missSec + 26} label="Play what happened" /></div>
                  {missObj ? <FloorLine type={missObj.type} moves={missObj.attempt_moves ?? []} floor={floor} /> : null}
                  <p className="mt-3 text-xs text-stewart-muted leading-relaxed"><span className="uppercase tracking-wider text-[10px]">On this floor</span><br />{show.miss.floor}</p>
                </div>
                <div className="rounded-lg border border-stewart-accent/40 bg-stewart-bg/60 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-stewart-accent">What it sounds like said the way that works</p>
                  <p className="mt-1 text-sm">{read.rep}: &ldquo;{show.miss.text}&rdquo;</p>
                  <p className="mt-1 text-[11px] text-stewart-muted">A suggested rephrase, in {read.rep}&apos;s voice. {read.rep} never said this.</p>
                  <div className="mt-3"><AltTake rep={read.rep} text={show.miss.text} label={`Hear ${read.rep} say it`} /></div>
                </div>
              </div>
            </div>
          </>
        ) : null}

        <p className="mt-10 text-sm text-stewart-muted">
          Every one of the {read.corpusCalls} calls has this. <Link href="/ion/manager" className="text-stewart-accent hover:underline">The manager&apos;s surface &rarr;</Link>
        </p>
      </div>
    </main>
  );
}

function SectionCard({ e, callId }: { e: Event; callId: string }) {
  const s = sec(e.ts);
  return (
    <>
      <p className="text-[11px] uppercase tracking-wider text-stewart-muted">{SECTION_LABEL[e.section] ?? e.section} &middot; {e.status.replace(/_/g, " ")}{e.result && e.result !== e.status ? ` · ${e.result}` : ""}{e.parts_score ? ` · ${e.parts_score}` : ""}</p>
      {e.status === "asked" ? (
        <>
          <p className="mt-2 text-sm">rep: &ldquo;{e.quote}&rdquo; <span className="font-mono text-xs text-stewart-muted">{e.ts}{e.end_ts ? `–${e.end_ts}` : ""}</span></p>
          {e.customer_quote ? <p className="mt-1 text-sm text-stewart-muted">customer ({e.customer_response}{e.resistance_reason ? `, ${e.resistance_reason}` : ""}): &ldquo;{e.customer_quote}&rdquo;</p> : null}
          {e.rep_followup && e.rep_followup !== "none" && e.rep_followup !== "n_a" ? <p className="mt-1 text-xs text-stewart-muted">then the rep {e.rep_followup.replace(/_/g, " ")}</p> : null}
          {e.parts_done?.length ? <p className="mt-1 text-xs text-stewart-muted">parts done: {e.parts_done.join(", ")}</p> : null}
          {s !== null ? <div className="mt-3"><AudioClip callId={callId} startSec={Math.max(0, s - 3)} endSec={(sec(e.end_ts) ?? s + 15) + 3} label="Play this section" /></div> : null}
        </>
      ) : (
        <p className="mt-2 text-sm text-stewart-muted">{e.status === "skipped" ? "The call kept going and the rep never ran this." : "The call ended before this point."}</p>
      )}
    </>
  );
}

function FloorLine({ type, moves, floor }: { type: string; moves: string[]; floor: FloorMoves }) {
  const typed = floor.byType[type] ?? {};
  const typedRanked = Object.entries(typed).filter(([, v]) => v.used >= 3);
  const thin = typedRanked.length < 2;
  const t = thin ? floor.all : typed;
  const ranked = Object.entries(t).filter(([, v]) => v.used >= 3).sort((a, b) => b[1].set / b[1].used - a[1].set / a[1].used);
  if (!ranked.length) return null;
  const best = ranked[0];
  const used = new Set(moves.filter((m) => m !== "concede" && m !== "restate"));
  return (
    <div className="mt-3 text-xs text-stewart-muted leading-relaxed">
      <p className="uppercase tracking-wider text-[10px]">On this floor, {thin ? "across every objection" : <>against &ldquo;{OBJ_LABEL[type] ?? type}&rdquo;</>}{thin ? ` (only ${Object.values(typed).reduce((n, v) => n + v.used, 0)} of this kind on the tape so far)` : ""}</p>
      {[...used].map((m) => t[m] ? <p key={m}>{MOVE_LABEL[m] ?? m}: sets {pct(t[m].set, t[m].used)} of the time ({t[m].used} tries)</p> : null)}
      <p className="text-stewart-text">Best move on the tape: {MOVE_LABEL[best[0]] ?? best[0]} — sets {pct(best[1].set, best[1].used)} ({best[1].used} tries)</p>
      {floor.byAngles["1"] && floor.byAngles["2"] ? (
        <p className="text-stewart-text">And a second angle matters: one angle sets {pct(floor.byAngles["1"].set, floor.byAngles["1"].n)} of the time, two sets {pct(floor.byAngles["2"].set, floor.byAngles["2"].n)}.</p>
      ) : null}
    </div>
  );
}

function ObjectionCard({ o, callId, floor }: { o: Objection; callId: string; floor: FloorMoves; corpusCalls: number }) {
  const s = sec(o.ts) ?? 0;
  return (
    <>
      <p className="text-[11px] uppercase tracking-wider text-stewart-muted">Objection &middot; {OBJ_LABEL[o.type] ?? o.type}{o.blocked_section ? ` · stalled ${SECTION_LABEL[o.blocked_section] ?? o.blocked_section}` : ""}</p>
      <p className="mt-2 text-sm">customer: &ldquo;{o.quote}&rdquo; <span className="font-mono text-xs text-stewart-muted">{o.ts}</span></p>
      <ol className="mt-2 space-y-1">
        {(o.attempt_quotes ?? []).map((q, i) => (
          <li key={i} className="text-sm"><span className="font-mono text-xs text-stewart-muted mr-1">{i + 1}.</span>&ldquo;{q}&rdquo; <span className="text-xs text-stewart-muted">— {MOVE_LABEL[o.attempt_moves?.[i] ?? ""] ?? o.attempt_moves?.[i] ?? ""}{o.attempt_kinds?.[i] === "restate" ? " (restate)" : ""}</span></li>
        ))}
      </ol>
      <p className="mt-2 text-xs"><span className={o.resolved_by_tape ? "text-stewart-success" : "text-stewart-danger"}>{o.resolved_by_tape ? `The script went on${o.next_event ? ` — ${o.next_event.replace("@", " at ")}` : ""}.` : "The script did not continue past this."}</span>{" "}<span className="text-stewart-muted">{o.rep_attempts} new {o.rep_attempts === 1 ? "angle" : "angles"}{o.rep_restates ? `, said it again ×${o.rep_restates}` : ""}.</span></p>
      <div className="mt-3"><AudioClip callId={callId} startSec={Math.max(0, s - 4)} endSec={s + 26} label="Play the objection" /></div>
      <FloorLine type={o.type} moves={o.attempt_moves ?? []} floor={floor} />
    </>
  );
}

function AuditCard({ id, data, callId }: { id: string; data: unknown; callId: string }) {
  const d = data as Record<string, unknown>;
  const ts = (d.result_ts || d.bill_ts || d.reason_ts || d.ask_ts) as string | undefined;
  const quote = (d.result_quote || d.bill_quote || d.reason_quote || d.ask_quote) as string | undefined;
  const title = id === "a:bill" ? `Bill amount captured${d.flip_executed === "yes" ? ", and used" : ", never used as the reason to act"}` : id === "a:doc" ? `The bill itself: ${String(d.result ?? "").replace(/_/g, " ")}${d.method && d.method !== "none" ? ` by ${d.method}` : ""}` : `The reason${d.reason_used === "yes" ? ", used later" : ", never used again"}`;
  return <GenericCard title={title} ts={ts ?? null} quote={quote ?? null} body={String(d.reasoning ?? "")} callId={callId} />;
}

function GenericCard({ title, ts, quote, body, callId }: { title: string; ts: string | null; quote: string | null; body: string; callId: string }) {
  const s = sec(ts);
  return (
    <>
      <p className="text-[11px] uppercase tracking-wider text-stewart-muted">{title}</p>
      {quote ? <p className="mt-2 text-sm">&ldquo;{quote}&rdquo; {ts ? <span className="font-mono text-xs text-stewart-muted">{ts}</span> : null}</p> : null}
      {body ? <p className="mt-2 text-xs text-stewart-muted leading-relaxed">{body}</p> : null}
      {s !== null ? <div className="mt-3"><AudioClip callId={callId} startSec={Math.max(0, s - 4)} endSec={s + 20} label="Play the moment" /></div> : null}
    </>
  );
}
