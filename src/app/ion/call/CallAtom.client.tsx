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
  attempt_quotes?: string[]; attempt_moves?: string[]; attempt_kinds?: string[]; resolved: boolean; resolved_by_tape?: boolean; next_event?: string | null; resolution_ts?: string | null; reasoning?: string;
};

// The clip for an objection runs until it was overcome: the read's resolution
// timestamp or the next script event, plus a tail; at least 25 s, at most 2 min.
function objectionClip(o: Objection): { start: number; end: number } {
  const t = sec(o.ts) ?? 0;
  const ends: number[] = [];
  const r = sec(o.resolution_ts ?? null); if (r !== null && r > t) ends.push(r);
  const nx = o.next_event && o.next_event.includes("@") ? sec(o.next_event.split("@")[1]) : null; if (nx !== null && nx > t) ends.push(nx);
  const end = (ends.length ? Math.min(...ends) : t + 19) + 6;
  return { start: Math.max(0, t - 5), end: Math.min(Math.max(end, t + 25), t + 120) };
}
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
export type BeyondClip = { call_id: string; rep: string; ts: string; start_sec: number; end_sec: number; quote: string; moves: string[]; attempts: number };
export type Beyond = {
  type: string;
  total: number;
  reps: { rep: string; n: number; set: number; continued: number; angles: number; set_rate: number }[];
  clipsByRep: Record<string, BeyondClip[]>;
};

const callPath = (i: number) => (i === 0 ? "/ion/call" : `/ion/call${i + 1}`);

export function CallAtom({ read, floor, tabs, beyond }: { read: CallRead; floor: FloorMoves; tabs: Tab[]; beyond: Beyond | null }) {
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
  const winSec = show ? sec(show.win.ts) ?? 0 : 0;
  const parts = (show?.misses ?? []).map((m) => ({
    m,
    obj: m.kind === "objection" ? objections.find((o) => o.ts === m.ts) ?? null : null,
    pick: read.picks.find((pk) => pk.ts === m.ts) ?? null,
    at: sec(m.ts) ?? 0,
  }));
  const beyondObj = parts.find((pt) => pt.obj)?.obj ?? null;

  const pos = (n: Node) => { const a = (n.angle * Math.PI) / 180; return { x: Math.cos(a) * n.r, y: Math.sin(a) * n.r }; };

  return (
    <main className="min-h-screen bg-black text-stewart-text">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-xs uppercase tracking-[0.25em] text-stewart-accent font-semibold">Powered by Stewart</p>
        <p className="mt-3 text-2xl sm:text-3xl font-bold leading-tight">Three of Ion&apos;s calls, read by Stewart.</p>
        <p className="mt-1 text-sm text-stewart-muted">Each call goes one level deeper than the last. Start with Call 1.</p>
        {tabs.length > 1 ? (
          <div className="mt-5 grid sm:grid-cols-3 gap-3">
            {tabs.map((t, i) => {
              const active = t.callId === read.callId;
              const sc = SHOWCASE[t.callId];
              return (
                <Link key={t.callId} href={callPath(i)} className={"rounded-xl border p-4 transition-colors " + (active ? "border-stewart-accent bg-stewart-accent/15 ring-1 ring-stewart-accent/40" : "border-stewart-border bg-stewart-card hover:border-stewart-accent/50")}>
                  <p className={"text-2xl font-bold " + (active ? "text-stewart-accent" : "text-stewart-text")}>Call {i + 1}</p>
                  <p className="mt-0.5 text-sm font-semibold text-stewart-text">{sc ? sc.levelTitle : ""}</p>
                  <p className="mt-2 text-xs text-stewart-muted">{t.rep ?? "?"} &middot; {t.durationMin ? `${t.durationMin.toFixed(1)} min` : ""} &middot; {t.outcome ? OUTCOME_LABEL[t.outcome] ?? t.outcome : ""}</p>
                  <p className="mt-1 text-xs text-stewart-muted leading-snug">{t.hook}</p>
                  {active ? <p className="mt-2 text-[11px] uppercase tracking-wider text-stewart-accent">You are here</p> : null}
                </Link>
              );
            })}
          </div>
        ) : null}
        <p className="mt-10 text-xs uppercase tracking-[0.25em] text-stewart-accent font-semibold">Call {Math.max(0, tabs.findIndex((t) => t.callId === read.callId)) + 1}{show ? ` \u00b7 ${show.levelTitle}` : ""}</p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-bold leading-tight">{read.rep ?? "A rep"} &middot; {read.durationMin ? `${read.durationMin.toFixed(1)} min` : ""} &middot; {outcome ? OUTCOME_LABEL[outcome.outcome] ?? outcome.outcome : ""}{outcome?.set_strength === "set_with_bill" ? ", bill in hand" : ""}</h1>
        <p className="mt-3 max-w-2xl text-stewart-muted leading-relaxed">Listen to the whole call. Then click anything on the atom to hear the second Stewart is talking about. Every quote on this page is on the tape{read.quotes ? ` — ${read.quotes.verified + read.quotes.fuzzy} of ${read.quotes.checked} checked` : ""}.</p>

        {/* The whole call, with a timeline of what Stewart found */}
        <div className="mt-8 rounded-xl border border-stewart-border bg-stewart-card p-4">
          <audio ref={audioRef} controls preload="metadata" className="w-full" src={`/api/ion/audio-clip/${encodeURIComponent(read.callId)}`} />
          {/* The timeline: every node from the atom, named, in call order. Script
              labels stagger below the line, everything else staggers above. */}
          <div className="relative mt-3 h-[12rem]">
            {(() => {
              const LINE = 6 * 16; // px from the top of the strip to the line
              const timed = nodes.filter((n) => n.ts).sort((x, y) => (sec(x.ts) ?? 0) - (sec(y.ts) ?? 0));
              // Collision-aware rows: a label takes the first row whose last label is far
              // enough left; up to four rows each side. Gap is in percent of the strip.
              const GAP = 8.5;
              const lastInRow = { below: [] as number[], above: [] as number[] };
              const placed = timed.map((n) => {
                const left = Math.min(100, Math.max(0, ((sec(n.ts) ?? 0) / dur) * 100));
                const side = n.kind === "section" ? "below" : "above";
                const rows = lastInRow[side];
                let row = rows.findIndex((last) => left - last >= GAP);
                if (row === -1) {
                  if (rows.length < 4) { row = rows.length; rows.push(left); }
                  else { row = rows.indexOf(Math.min(...rows)); rows[row] = left; }
                } else rows[row] = left;
                return { n, left, side, row };
              });
              return (
                <>
                  <div className="absolute inset-x-0 h-1 rounded bg-white/10" style={{ top: LINE }} />
                  {placed.map(({ n, left, side, row }) => {
                    const isSection = side === "below";
                    const dotSize = n.kind === "focus" ? 20 : isSection ? 10 : 14;
                    const labelTop = isSection ? LINE + 14 + row * 15 : LINE - 26 - row * 15;
                    const active = selected === n.id;
                    const anchor = left > 92 ? "translate(-100%, 0)" : left < 8 ? "translate(0, 0)" : "translate(-50%, 0)";
                    return (
                      <div key={n.id} className="absolute" style={{ left: `${left}%` }}>
                        <div className="absolute -translate-x-1/2 w-px bg-white/15" style={isSection ? { top: LINE + 6, height: labelTop - (LINE + 6) } : { top: labelTop + 11, height: LINE - 7 - (labelTop + 11) }} />
                        <button type="button" onClick={() => pick(n)} title={`${n.label} ${n.ts}`}
                          className={"absolute -translate-x-1/2 rounded-full border " + (active ? "border-white" : "border-black")}
                          style={{ top: LINE + 2 - dotSize / 2, width: dotSize, height: dotSize, background: n.tone }} />
                        <button type="button" onClick={() => pick(n)}
                          className={"absolute whitespace-nowrap text-[10px] leading-none px-1 rounded bg-black/70 hover:text-stewart-text " + (active ? "text-stewart-text font-semibold" : isSection ? "text-stewart-muted" : "text-stewart-text")}
                          style={{ top: labelTop, transform: anchor }}>
                          {n.label}
                        </button>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
          <p className="text-[11px] text-stewart-muted">Below the line: the script, in order. Above it: objections, the bill, the reason, the outcome, where to coach. Click any of them to jump the player there.</p>
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
                const focus = n.kind === "focus";
                const radius = focus ? (active ? 26 : 22) : active ? (big ? 16 : 11) : big ? 12 : 8;
                return (
                  <g key={n.id} transform={`translate(${p.x} ${p.y})`} onClick={() => pick(n)} style={{ cursor: "pointer" }}>
                    {focus ? <circle r={radius + 10} fill={n.tone} fillOpacity={0.12} /> : null}
                    <circle r={radius} fill={filled ? n.tone : "#000"} stroke={focus ? "#fff" : n.tone} strokeWidth={focus ? 2 : active ? 3 : 1.5} fillOpacity={filled ? 0.9 : 1} />
                    {n.kind === "objection" ? <text textAnchor="middle" y={4} fill="#000" fontSize={10} fontWeight={700}>{(n.data as Objection).rep_attempts}</text> : null}
                    <text textAnchor={p.x > 20 ? "start" : p.x < -20 ? "end" : "middle"} x={p.x > 20 ? radius + 6 : p.x < -20 ? -(radius + 6) : 0} y={p.x > 20 || p.x < -20 ? 4 : p.y > 0 ? radius + 14 : -(radius + 8)} fill={focus ? "#e5e7eb" : active ? "#e5e7eb" : "#9ca3af"} fontSize={focus ? 13 : 11} fontWeight={focus ? 700 : 400}>{n.label}{n.ts ? ` ${n.ts}` : ""}</text>
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

            {parts.map(({ m, obj, pick, at }, pi) => (
              <div key={m.ts} className="mt-6 rounded-xl border border-stewart-accent/40 bg-stewart-accent/5 p-5">
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stewart-accent">{parts.length > 1 ? `The one-on-one, part ${pi + 1} of ${parts.length}` : "The moment the one-on-one is about"}</p>
                <h2 className="mt-2 text-xl sm:text-2xl font-bold">{m.title}</h2>
                <p className="mt-2 text-sm text-stewart-muted leading-relaxed">{m.why}</p>
                {(() => { const withBeyond = show.level === 3 && !!beyond && !!obj && obj === beyondObj; return (
                <div className={"mt-4 grid gap-4 " + (withBeyond ? "lg:grid-cols-3 md:grid-cols-2" : show.level >= 2 ? "md:grid-cols-2" : "")}>
                  <div className="rounded-lg border border-stewart-border bg-stewart-bg/60 p-4">
                    <p className="text-[11px] uppercase tracking-wider text-stewart-muted">What {read.rep} said</p>
                    {obj ? (
                      <div className="mt-2"><ObjectionSequence o={obj} rep={read.rep} callId={read.callId} floor={floor} clip={m.clip} /></div>
                    ) : m.said ? (
                      m.said.map((ln, i) => <p key={i} className="mt-1 text-sm">{ln.who === "rep" ? read.rep : "customer"}: &ldquo;{ln.line}&rdquo;</p>)
                    ) : pick ? (
                      <>
                        <p className="mt-1 text-sm">&ldquo;{pick.quote}&rdquo; <span className="font-mono text-xs text-stewart-muted">{pick.ts}</span></p>
                        <p className="mt-1 text-xs text-stewart-muted leading-relaxed">{pick.stewart_read}</p>
                      </>
                    ) : null}
                    {!obj ? <div className="mt-3"><AudioClip callId={read.callId} startSec={m.clip?.start ?? Math.max(0, at - 4)} endSec={m.clip?.end ?? at + 26} label="Play what happened" /></div> : null}
                    {!obj ? <div className="mt-3 rounded-md border px-3 py-2" style={{ borderColor: "#f59e0b", background: "rgba(245,158,11,0.08)" }}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#f59e0b" }}>On this floor</p>
                      <p className="mt-1 text-sm text-stewart-text leading-relaxed">
                        {m.floor.split(/(\d+%)/g).map((piece, i) => /^\d+%$/.test(piece) ? <span key={i} className="font-mono font-bold" style={{ color: "#f59e0b" }}>{piece}</span> : <span key={i}>{piece}</span>)}
                      </p>
                    </div> : null}
                  </div>
                  {show.level >= 2 ? (
                    <div className="rounded-lg border-2 bg-stewart-bg/60 p-4" style={{ borderColor: "#a78bfa", boxShadow: "0 0 0 1px rgba(167,139,250,0.35), 0 0 24px rgba(167,139,250,0.25)" }}>
                      <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#a78bfa" }}>What it could have sounded like</p>
                      <p className="mt-1 text-sm">{read.rep}: &ldquo;{m.text}&rdquo;</p>
                      <p className="mt-1 text-[11px] text-stewart-warning">Synthetic coaching example. {read.rep} never said this &mdash; it is a suggested line rendered in a cloned voice.</p>
                      <div className="mt-3"><AltTake rep={read.rep ?? ""} text={m.text} label={`Hear it in ${read.rep}\u2019s voice`} /></div>
                    </div>
                  ) : null}
                  {withBeyond && beyond ? <BeyondCard beyond={beyond} floor={floor} rep={read.rep} /> : null}
                </div>
                ); })()}
              </div>
            ))}

          </>
        ) : null}

        {objections.length ? (
          <div className="mt-10">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stewart-accent">Every objection on this call, the same way</p>
            <h2 className="mt-2 text-xl sm:text-2xl font-bold">{objections.length} {objections.length === 1 ? "objection" : "objections"}. The objection, the attempts, how many it took, and whether it was overcome.</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {objections.map((o, i) => (
                <div key={o.ts + i} className={"rounded-xl border p-4 " + (o.resolved_by_tape ? "border-stewart-border bg-stewart-card" : "border-stewart-danger/40 bg-stewart-danger/5")}>
                  <p className="text-[11px] uppercase tracking-wider text-stewart-muted mb-2">{OBJ_LABEL[o.type] ?? o.type} &middot; {o.ts}</p>
                  <ObjectionSequence o={o} rep={read.rep} callId={read.callId} floor={floor} clip={objectionClip(o)} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {(() => {
          const i = tabs.findIndex((t) => t.callId === read.callId);
          const next = i >= 0 && i < tabs.length - 1 ? tabs[i + 1] : null;
          const nsc = next ? SHOWCASE[next.callId] : null;
          return next ? (
            <Link href={callPath(i + 1)} className="mt-10 block rounded-xl border border-stewart-accent/50 bg-stewart-accent/10 p-5 hover:bg-stewart-accent/15 transition-colors">
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stewart-accent">Next</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold">Call {i + 2}{nsc ? ` \u00b7 ${nsc.levelTitle}` : ""} &rarr;</p>
              <p className="mt-1 text-sm text-stewart-muted">{next.rep} &middot; {next.hook}</p>
            </Link>
          ) : null;
        })()}

        <div className="mt-14 border-t border-white/10 pt-8">
          <p className="text-xl sm:text-2xl font-semibold leading-snug">This is already running on Ion&apos;s data. This is what exists today.</p>
          <p className="mt-2 text-sm text-stewart-muted">{read.corpusCalls} of your calls, read this way.</p>
        </div>
      </div>
    </main>
  );
}

// The third pillar on a level-3 part: one behaviour, exploded outward onto the
// floor — who gets past this no, the moves that set, and the tape.
function BeyondCard({ beyond, floor, rep }: { beyond: Beyond; floor: FloorMoves; rep: string | null }) {
  const moves = Object.entries(floor.byType[beyond.type] ?? {}).filter(([, v]) => v.used >= 3).sort((a, b) => b[1].set / b[1].used - a[1].set / a[1].used).slice(0, 4);
  const withTape = beyond.reps.filter((r) => (beyond.clipsByRep[r.rep] ?? []).length > 0);
  const [who, setWho] = useState<string | null>(withTape[0]?.rep ?? null);
  const clips = who ? beyond.clipsByRep[who] ?? [] : [];
  return (
    <div className="rounded-lg border-2 bg-stewart-bg/60 p-4" style={{ borderColor: "#f59e0b", boxShadow: "0 0 0 1px rgba(245,158,11,0.3), 0 0 24px rgba(245,158,11,0.18)" }}>
      <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#f59e0b" }}>Beyond this call</p>
      <p className="mt-1 text-sm font-semibold leading-snug">&ldquo;{OBJ_LABEL[beyond.type] ?? beyond.type}&rdquo; came up {beyond.total} times on this floor. Click a rep to hear how they get past it.</p>
      <div className="mt-3 flex items-baseline gap-2 text-[10px] uppercase tracking-wider text-stewart-muted border-b border-stewart-border pb-1 mb-1">
        <span className="flex-1">rep</span><span className="w-10 text-right">faced</span><span className="w-12 text-right">angles</span><span className="w-10 text-right">set</span>
      </div>
      <ul className="text-xs space-y-0.5">
        {beyond.reps.slice(0, 7).map((r) => {
          const has = (beyond.clipsByRep[r.rep] ?? []).length > 0;
          const active = who === r.rep;
          return (
            <li key={r.rep}>
              <button type="button" disabled={!has} onClick={() => setWho(active ? null : r.rep)}
                className={"w-full flex items-baseline gap-2 rounded px-1 -mx-1 text-left " + (active ? "bg-stewart-warning/15 text-stewart-text" : r.rep === rep ? "text-stewart-warning" : has ? "hover:bg-white/5" : "opacity-60 cursor-default")}>
                <span className="flex-1 font-semibold truncate">{has ? (active ? "\u25be " : "\u25b8 ") : ""}{r.rep}{r.rep === rep ? " (this call)" : ""}</span>
                <span className="font-mono text-stewart-muted w-10 text-right">{r.n}</span>
                <span className="font-mono text-stewart-muted w-12 text-right">{(r.angles / r.n).toFixed(1)}</span>
                <span className="font-mono w-10 text-right text-stewart-success">{pct(r.set, r.n)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {who && clips.length ? (
        <div className="mt-3 rounded border border-stewart-warning/40 bg-black/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-stewart-warning">How {who} handles it &middot; same no, script went on, appointment set</p>
          <ul className="mt-2 space-y-2">
            {clips.map((c) => (
              <li key={c.call_id + c.ts} className="text-xs">
                <p className="text-[11px] text-stewart-muted"><span className="font-mono">{c.ts}</span> &middot; {c.attempts} {c.attempts === 1 ? "angle" : "angles"}: {c.moves.map((m) => MOVE_LABEL[m] ?? m).join(", ")}</p>
                <p className="mt-0.5 leading-snug">customer: &ldquo;{c.quote}&rdquo;</p>
                <div className="mt-1"><AudioClip callId={c.call_id} startSec={c.start_sec} endSec={c.end_sec} label={`Play ${who}`} /></div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-3 flex items-baseline gap-2 text-[10px] uppercase tracking-wider text-stewart-muted border-b border-stewart-border pb-1 mb-1">
        <span className="flex-1">move the rep made</span><span className="w-8 text-right">used</span><span className="w-10 text-right">set</span>
      </div>
      <ul className="text-xs space-y-0.5">
        {moves.map(([m, v]) => (
          <li key={m} className="flex items-baseline gap-2"><span className="flex-1 truncate">{MOVE_LABEL[m] ?? m}</span><span className="font-mono text-stewart-muted w-8 text-right">{v.used}</span><span className="font-mono w-10 text-right text-stewart-success">{pct(v.set, v.used)}</span></li>
        ))}
      </ul>
    </div>
  );
}

// The training sequence for an objection, always in this order:
//   the objection → did the rep try → each attempt and whether it moved the
//   customer → how many it took → was it overcome → if not, what works on
//   this floor. One component, used wherever an objection is shown.
export function ObjectionSequence({ o, rep, callId, floor, clip, couldHave }: {
  o: Objection; rep: string | null; callId: string; floor: FloorMoves;
  clip?: { start: number; end: number };
  couldHave?: React.ReactNode;
}) {
  const s = sec(o.ts) ?? 0;
  const quotes = o.attempt_quotes ?? [];
  const moves = o.attempt_moves ?? [];
  const kinds = o.attempt_kinds ?? [];
  const results = (o as Objection & { attempt_results?: string[] }).attempt_results ?? [];
  const tried = quotes.filter((_, i) => moves[i] !== "concede").length > 0;
  const overcome = !!o.resolved_by_tape;
  const typed = floor.byType[o.type] ?? {};
  const best = Object.entries(typed).filter(([, v]) => v.used >= 3).sort((a, b) => b[1].set / b[1].used - a[1].set / a[1].used)[0] ?? null;
  const Row = ({ k, v, tone }: { k: string; v: React.ReactNode; tone?: string }) => (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-1.5 border-t border-stewart-border/60 first:border-t-0">
      <span className="text-[10px] uppercase tracking-wider text-stewart-muted pt-0.5">{k}</span>
      <span className={"text-sm leading-snug " + (tone ?? "")}>{v}</span>
    </div>
  );
  return (
    <div>
      <Row k="The objection" v={<>customer: &ldquo;{o.quote}&rdquo; <span className="font-mono text-xs text-stewart-muted">{o.ts}</span>{o.blocked_section ? <span className="text-xs text-stewart-muted"> &middot; stalled {SECTION_LABEL[o.blocked_section] ?? o.blocked_section}</span> : null}</>} />
      <Row k="Tried to overcome it?" v={tried ? "Yes" : "No"} tone={tried ? "text-stewart-success font-semibold" : "text-stewart-danger font-semibold"} />
      {quotes.length ? (
        <Row k="The attempts" v={
          <ol className="space-y-1">
            {quotes.map((q, i) => {
              const last = i === quotes.length - 1;
              const r = results[i];
              const verdict = r ? r.replace(/_/g, " ") : last ? (overcome ? "the customer moved" : moves[i] === "concede" ? "the rep let it go" : "the customer held") : "the customer held";
              return (
                <li key={i}>
                  <span className="font-mono text-xs text-stewart-muted mr-1">{i + 1}.</span>&ldquo;{q}&rdquo;
                  <span className="text-xs text-stewart-muted"> &mdash; {MOVE_LABEL[moves[i] ?? ""] ?? moves[i] ?? ""}{kinds[i] === "restate" ? " (said it again)" : ""} &rarr; {verdict}</span>
                </li>
              );
            })}
          </ol>
        } />
      ) : null}
      <Row k="How many it took" v={tried ? `${o.rep_attempts} new ${o.rep_attempts === 1 ? "angle" : "angles"}${o.rep_restates ? `, said it again \u00d7${o.rep_restates}` : ""}` : "none"} />
      <Row k="Overcome?" v={overcome ? <>Yes &mdash; the script went on{o.next_event ? ` to ${o.next_event.replace("@", " at ")}` : ""}.</> : <>No &mdash; the script did not continue past this.</>} tone={overcome ? "text-stewart-success font-semibold" : "text-stewart-danger font-semibold"} />
      <div className="mt-2"><AudioClip callId={callId} startSec={clip?.start ?? objectionClip(o).start} endSec={clip?.end ?? objectionClip(o).end} label="Play the objection" /></div>
      {!overcome ? (
        <div className="mt-3 rounded-md border px-3 py-2" style={{ borderColor: "#f59e0b", background: "rgba(245,158,11,0.08)" }}>
          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#f59e0b" }}>What works on this floor against &ldquo;{OBJ_LABEL[o.type] ?? o.type}&rdquo;</p>
          {best ? <p className="mt-1 text-sm">{MOVE_LABEL[best[0]] ?? best[0]} &mdash; sets <span className="font-mono font-bold" style={{ color: "#f59e0b" }}>{pct(best[1].set, best[1].used)}</span> of the time ({best[1].used} tries).</p> : null}
          {floor.byAngles["1"] && floor.byAngles["2"] ? <p className="mt-1 text-sm">One angle sets <span className="font-mono font-bold" style={{ color: "#f59e0b" }}>{pct(floor.byAngles["1"].set, floor.byAngles["1"].n)}</span>, two sets <span className="font-mono font-bold" style={{ color: "#f59e0b" }}>{pct(floor.byAngles["2"].set, floor.byAngles["2"].n)}</span>.</p> : null}
          {couldHave ? <div className="mt-2">{couldHave}</div> : null}
        </div>
      ) : null}
    </div>
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
  return (
    <>
      <p className="text-[11px] uppercase tracking-wider text-stewart-muted mb-2">Objection &middot; {OBJ_LABEL[o.type] ?? o.type}</p>
      <ObjectionSequence o={o} rep={null} callId={callId} floor={floor} />
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
