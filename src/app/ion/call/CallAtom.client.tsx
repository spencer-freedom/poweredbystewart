"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AltTake } from "../(public)/_components/AltTake.client";
import { AudioClip } from "../(public)/_components/AudioClip.client";

// One call, taken apart. The whole call plays at the top; everything Stewart
// read is a node on the atom below; clicking a node seeks the player to that
// second and opens what was said. Beside each objection: what the rep did,
// and what works on this floor for that objection. For the moment the rep
// conceded, the line he could have said, rendered in his own voice.
//
// This component only draws. Everything it receives is already in plain
// words, and every piece of tape is a clip URL the server signed. Nothing
// here names a field of the read, so neither the page payload nor this
// bundle describes how the read is made.

export type Clip = { src: string };
export type Step = {
  id: string; name: string; at: string | null; end: string | null; state: "ran" | "partial" | "skipped" | "unreached";
  said: string | null; customerSaid: string | null; customerDid: string | null; why: string | null; then: string | null;
  parts: { score: string; done: string[] } | null; clip: Clip | null;
};
export type Try = { said: string; how: string; same: boolean; then: string };
export type No = {
  id: string; at: string; said: string; kind: string; where: string | null; whereName: string | null;
  angles: number; repeats: number; tried: boolean; tries: Try[]; overcome: boolean;
  next: { name: string; at: string } | null; clip: Clip; best: { how: string; set: number; n: number } | null;
};
export type Note = { id: string; label: string; at: string | null; good: boolean; title: string; said: string | null; clip: Clip | null };
export type Moment = { title: string; at: string | null; said: string | null; why: string; clip: Clip | null };
export type Result = { label: string; at: string | null; said: string | null; tone: "good" | "warn" | "flat"; billInHand: boolean; clip: Clip | null };
export type Part = {
  title: string; why: string; text: string; floor: string; at: string; noId: string | null;
  said: { who: "rep" | "customer"; line: string }[] | null; pick: { said: string; read: string } | null; clip: Clip;
};
export type Beyond = {
  kind: string; total: number;
  reps: { rep: string; n: number; set: number; angles: number }[];
  clipsByRep: Record<string, { at: string; said: string; angles: number; hows: string[]; clip: Clip }[]>;
  moves: { how: string; used: number; set: number }[];
};
export type Tab = { callId: string; rep: string | null; durationMin: number | null; outcome: string | null; hook: string; levelTitle: string };
export type View = {
  callId: string; fullSrc: string; rep: string | null; durationMin: number | null; corpusCalls: number;
  checked: { ok: number; total: number } | null;
  level: number; levelTitle: string; summary: string;
  focus: Moment | null;
  win: { title: string; why: string; at: string; clip: Clip } | null;
  parts: Part[];
  steps: Step[]; nos: No[]; notes: Note[]; result: Result | null;
  angles: { one: { set: number; n: number } | null; two: { set: number; n: number } | null };
  beyond: Beyond | null;
  tabs: Tab[];
};

// A stat with its sample size first, and a flag when the sample is thin.
export function stat(set: number, n: number): React.ReactNode {
  return <>{n} {n === 1 ? "try" : "tries"}, <span className="font-mono font-bold" style={{ color: "#f59e0b" }}>{pct(set, n)}</span> set{n < 10 ? <span className="text-stewart-muted"> (small sample)</span> : null}</>;
}

const sec = (ts?: string | null) => { if (!ts) return null; const [m, s] = ts.split(":").map((x) => parseInt(x, 10) || 0); return (m || 0) * 60 + (s || 0); };
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

type Node = { id: string; kind: "step" | "no" | "note" | "result" | "coach"; label: string; at: string | null; angle: number; r: number; tone: string; ref: Step | No | Note | Result | Moment };

const STEP_TONE: Record<Step["state"], string> = { ran: "#3b82f6", partial: "#f59e0b", skipped: "#ef4444", unreached: "#374151" };
const RESULT_TONE: Record<Result["tone"], string> = { good: "#22c55e", warn: "#f59e0b", flat: "#9ca3af" };
const callPath = (i: number) => (i === 0 ? "/ion/call" : `/ion/call${i + 1}`);

export function CallAtom({ view }: { view: View }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const { steps, nos, notes, result, focus, tabs, beyond, parts } = view;
  const dur = view.durationMin ? view.durationMin * 60 : Math.max(...steps.map((e) => sec(e.end || e.at) ?? 0), ...nos.map((o) => sec(o.at) ?? 0)) + 30;

  const nodes = useMemo<Node[]>(() => {
    const out: Node[] = [];
    const n = steps.length || 13;
    steps.forEach((e, i) => {
      out.push({ id: e.id, kind: "step", label: e.name, at: e.at, angle: -90 + (360 / n) * i, r: 150, tone: STEP_TONE[e.state], ref: e });
    });
    nos.forEach((o, i) => {
      const blocked = steps.findIndex((e) => e.id === o.where);
      const angle = blocked >= 0 ? -90 + (360 / n) * blocked + 12 * (i + 1) : -90 + (360 / Math.max(nos.length, 1)) * i;
      out.push({ id: o.id, kind: "no", label: o.kind, at: o.at, angle, r: 250, tone: o.overcome ? "#f59e0b" : "#ef4444", ref: o });
    });
    // Outer-ring nodes that aren't tied to a step take the freest angles,
    // so labels never pile up on one side.
    const used = () => out.filter((x) => x.r === 250).map((x) => ((x.angle % 360) + 360) % 360);
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
    if (result) out.push({ id: "x:result", kind: "result", label: result.label, at: result.at, angle: freest(), r: 250, tone: RESULT_TONE[result.tone], ref: result });
    notes.forEach((a) => out.push({ id: a.id, kind: "note", label: a.label, at: a.at, angle: freest(), r: 250, tone: a.good ? "#22c55e" : "#f59e0b", ref: a }));
    if (focus) out.push({ id: "x:focus", kind: "coach", label: "Where to coach", at: focus.at, angle: freest(), r: 250, tone: "#a78bfa", ref: focus });
    return out;
  }, [steps, nos, notes, result, focus]);

  const seek = (ts: string | null) => {
    const s = sec(ts);
    if (s === null || !audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, s - 3);
    void audioRef.current.play().catch(() => {});
  };
  const pick = (n: Node) => { setSelected(n.id); seek(n.at); };
  const sel = nodes.find((n) => n.id === selected) ?? null;
  const partOf = (noId: string) => parts.some((pt) => pt.noId === noId);
  const beyondNo = parts.find((pt) => pt.noId)?.noId ?? null;
  const callNo = Math.max(0, tabs.findIndex((t) => t.callId === view.callId)) + 1;

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
              const active = t.callId === view.callId;
              return (
                <Link key={t.callId} href={callPath(i)} className={"rounded-xl border p-4 transition-colors " + (active ? "border-stewart-accent bg-stewart-accent/15 ring-1 ring-stewart-accent/40" : "border-stewart-border bg-stewart-card hover:border-stewart-accent/50")}>
                  <p className={"text-2xl font-bold " + (active ? "text-stewart-accent" : "text-stewart-text")}>Call {i + 1}</p>
                  <p className="mt-0.5 text-sm font-semibold text-stewart-text">{t.levelTitle}</p>
                  <p className="mt-2 text-xs text-stewart-muted">{t.rep ?? "?"} &middot; {t.durationMin ? `${t.durationMin.toFixed(1)} min` : ""} &middot; {t.outcome ?? ""}</p>
                  <p className="mt-1 text-xs text-stewart-muted leading-snug">{t.hook}</p>
                  {active ? <p className="mt-2 text-[11px] uppercase tracking-wider text-stewart-accent">You are here</p> : null}
                </Link>
              );
            })}
          </div>
        ) : null}
        <p className="mt-10 text-xs uppercase tracking-[0.25em] text-stewart-accent font-semibold">Call {callNo}{view.levelTitle ? ` · ${view.levelTitle}` : ""}</p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-bold leading-tight">{view.rep ?? "A rep"} &middot; {view.durationMin ? `${view.durationMin.toFixed(1)} min` : ""} &middot; {result?.label ?? ""}{result?.billInHand ? ", bill in hand" : ""}</h1>
        <p className="mt-3 max-w-2xl text-stewart-muted leading-relaxed">Listen to the whole call. Then click anything on the atom to hear the second Stewart is talking about. Every quote on this page is on the tape{view.checked ? ` — ${view.checked.ok} of ${view.checked.total} checked` : ""}.</p>

        {/* The whole call, with a timeline of what Stewart found */}
        <div className="mt-8 rounded-xl border border-stewart-border bg-stewart-card p-4">
          <audio ref={audioRef} controls preload="metadata" className="w-full" src={view.fullSrc} />
          {/* The timeline: every node from the atom, named, in call order. Script
              labels stagger below the line, everything else staggers above. */}
          <div className="relative mt-3 h-[12rem]">
            {(() => {
              const LINE = 6 * 16; // px from the top of the strip to the line
              const timed = nodes.filter((n) => n.at).sort((x, y) => (sec(x.at) ?? 0) - (sec(y.at) ?? 0));
              // Collision-aware rows: a label takes the first row whose last label is far
              // enough left; up to four rows each side. Gap is in percent of the strip.
              const GAP = 8.5;
              const lastInRow = { below: [] as number[], above: [] as number[] };
              const placed = timed.map((n) => {
                const left = Math.min(100, Math.max(0, ((sec(n.at) ?? 0) / dur) * 100));
                const side = n.kind === "step" ? "below" : "above";
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
                    const isStep = side === "below";
                    const dotSize = n.kind === "coach" ? 20 : isStep ? 10 : 14;
                    const labelTop = isStep ? LINE + 14 + row * 15 : LINE - 26 - row * 15;
                    const active = selected === n.id;
                    const anchor = left > 92 ? "translate(-100%, 0)" : left < 8 ? "translate(0, 0)" : "translate(-50%, 0)";
                    return (
                      <div key={n.id} className="absolute" style={{ left: `${left}%` }}>
                        <div className="absolute -translate-x-1/2 w-px bg-white/15" style={isStep ? { top: LINE + 6, height: labelTop - (LINE + 6) } : { top: labelTop + 11, height: LINE - 7 - (labelTop + 11) }} />
                        <button type="button" onClick={() => pick(n)} title={`${n.label} ${n.at}`}
                          className={"absolute -translate-x-1/2 rounded-full border " + (active ? "border-white" : "border-black")}
                          style={{ top: LINE + 2 - dotSize / 2, width: dotSize, height: dotSize, background: n.tone }} />
                        <button type="button" onClick={() => pick(n)}
                          className={"absolute whitespace-nowrap text-[10px] leading-none px-1 rounded bg-black/70 hover:text-stewart-text " + (active ? "text-stewart-text font-semibold" : isStep ? "text-stewart-muted" : "text-stewart-text")}
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
              {/* bonds: objection → the step it blocked */}
              {nodes.filter((n) => n.kind === "no").map((n) => {
                const o = n.ref as No; const t = nodes.find((m) => m.id === o.where); if (!t) return null;
                const a = pos(n), c = pos(t);
                return <line key={n.id + "b"} x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={n.tone} strokeOpacity={0.5} strokeWidth={2} strokeDasharray={o.overcome ? undefined : "4 4"} />;
              })}
              {/* script ring */}
              <circle r={150} fill="none" stroke="#ffffff" strokeOpacity={0.08} />
              {nodes.filter((n) => n.kind === "step").map((n, i, arr) => {
                const a = pos(n); const next = arr[(i + 1) % arr.length]; const bpos = pos(next);
                const ran = (x: Node) => { const s = (x.ref as Step).state; return s === "ran" || s === "partial"; };
                return <line key={n.id + "r"} x1={a.x} y1={a.y} x2={bpos.x} y2={bpos.y} stroke="#3b82f6" strokeOpacity={ran(n) && ran(next) ? 0.35 : 0.08} strokeWidth={1.5} />;
              })}
              {/* nucleus */}
              <circle r={54} fill="#0b1220" stroke="#3b82f6" strokeOpacity={0.6} />
              <text textAnchor="middle" y={-6} fill="#e5e7eb" fontSize={14} fontWeight={700}>{view.rep ?? "call"}</text>
              <text textAnchor="middle" y={12} fill="#9ca3af" fontSize={10}>{steps.filter((e) => e.state === "ran" || e.state === "partial").length} of {steps.length} sections</text>
              <text textAnchor="middle" y={26} fill="#9ca3af" fontSize={10}>{nos.length} objection{nos.length === 1 ? "" : "s"}</text>
              {/* nodes */}
              {nodes.map((n) => {
                const p = pos(n); const active = selected === n.id; const big = n.kind !== "step";
                const filled = n.kind !== "step" || (n.ref as Step).state === "ran" || (n.ref as Step).state === "partial";
                const coach = n.kind === "coach";
                const radius = coach ? (active ? 26 : 22) : active ? (big ? 16 : 11) : big ? 12 : 8;
                return (
                  <g key={n.id} transform={`translate(${p.x} ${p.y})`} onClick={() => pick(n)} style={{ cursor: "pointer" }}>
                    {coach ? <circle r={radius + 10} fill={n.tone} fillOpacity={0.12} /> : null}
                    <circle r={radius} fill={filled ? n.tone : "#000"} stroke={coach ? "#fff" : n.tone} strokeWidth={coach ? 2 : active ? 3 : 1.5} fillOpacity={filled ? 0.9 : 1} />
                    {n.kind === "no" ? <text textAnchor="middle" y={4} fill="#000" fontSize={10} fontWeight={700}>{(n.ref as No).angles}</text> : null}
                    <text textAnchor={p.x > 20 ? "start" : p.x < -20 ? "end" : "middle"} x={p.x > 20 ? radius + 6 : p.x < -20 ? -(radius + 6) : 0} y={p.x > 20 || p.x < -20 ? 4 : p.y > 0 ? radius + 14 : -(radius + 8)} fill={coach ? "#e5e7eb" : active ? "#e5e7eb" : "#9ca3af"} fontSize={coach ? 13 : 11} fontWeight={coach ? 700 : 400}>{n.label}{n.at ? ` ${n.at}` : ""}</text>
                  </g>
                );
              })}
            </svg>
            <p className="px-3 pb-2 text-[11px] text-stewart-muted leading-snug">
              <span className="inline-block w-2 h-2 rounded-full bg-[#3b82f6] mr-1 align-middle" />blue ran as scripted;
              <span className="inline-block w-2 h-2 rounded-full bg-[#f59e0b] ml-2 mr-1 align-middle" />amber ran partly, or a no the script got past;
              <span className="inline-block w-2 h-2 rounded-full bg-[#ef4444] ml-2 mr-1 align-middle" />red was skipped, or a no that stopped it;
              <span className="inline-block w-2 h-2 rounded-full bg-[#374151] ml-2 mr-1 align-middle" />grey was never reached. The number on an objection is how many angles the rep tried.
            </p>
          </div>

          {/* The detail card */}
          <div className="rounded-xl border border-stewart-border bg-stewart-card p-4 min-h-[16rem]">
            {!sel ? (
              <>
                <p className="text-[11px] uppercase tracking-wider text-stewart-muted">The call in one paragraph</p>
                <p className="mt-2 text-sm leading-relaxed">{view.summary}</p>
                {focus ? (
                  <>
                    <p className="mt-4 text-[11px] uppercase tracking-wider text-stewart-muted">Where to spend the one-on-one</p>
                    <p className="mt-1 text-sm font-semibold">{focus.title} <span className="font-mono text-xs text-stewart-muted">{focus.at}</span></p>
                    <p className="mt-1 text-xs text-stewart-muted leading-relaxed">{focus.why}</p>
                  </>
                ) : null}
                <p className="mt-4 text-xs text-stewart-muted">Click a node.</p>
              </>
            ) : sel.kind === "step" ? (
              <StepCard e={sel.ref as Step} />
            ) : sel.kind === "no" ? (
              <>
                <p className="text-[11px] uppercase tracking-wider text-stewart-muted mb-2">Objection &middot; {(sel.ref as No).kind}</p>
                <ObjectionSequence no={sel.ref as No} rep={null} angles={view.angles} />
              </>
            ) : sel.kind === "note" ? (
              <MomentCard title={(sel.ref as Note).title} at={(sel.ref as Note).at} said={(sel.ref as Note).said} body="" clip={(sel.ref as Note).clip} />
            ) : sel.kind === "result" ? (
              <MomentCard title={(sel.ref as Result).label} at={(sel.ref as Result).at} said={(sel.ref as Result).said} body="" clip={(sel.ref as Result).clip} />
            ) : (
              <MomentCard title={(sel.ref as Moment).title} at={(sel.ref as Moment).at} said={(sel.ref as Moment).said} body={(sel.ref as Moment).why} clip={(sel.ref as Moment).clip} />
            )}
          </div>
        </div>

        {view.win && view.rep ? (
          <>
            <div className="mt-8 rounded-xl border border-stewart-success/40 bg-stewart-success/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stewart-success">What he got right</p>
              <h2 className="mt-2 text-xl sm:text-2xl font-bold">{view.win.title}</h2>
              <p className="mt-2 text-sm text-stewart-muted leading-relaxed">{view.win.why}</p>
              <div className="mt-3"><AudioClip src={view.win.clip.src} label={`Play ${view.win.at}`} /></div>
            </div>

            {parts.map((m, pi) => {
              const no = m.noId ? nos.find((o) => o.id === m.noId) ?? null : null;
              const withBeyond = view.level === 3 && !!beyond && !!no && no.id === beyondNo;
              return (
              <div key={m.at} className="mt-6 rounded-xl border border-stewart-accent/40 bg-stewart-accent/5 p-5">
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stewart-accent">{parts.length > 1 ? `The one-on-one, part ${pi + 1} of ${parts.length}` : "The moment the one-on-one is about"}</p>
                <h2 className="mt-2 text-xl sm:text-2xl font-bold">{m.title}</h2>
                <p className="mt-2 text-sm text-stewart-muted leading-relaxed">{m.why}</p>
                <div className={"mt-4 grid gap-4 " + (withBeyond ? "lg:grid-cols-3 md:grid-cols-2" : view.level >= 2 ? "md:grid-cols-2" : "")}>
                  <div className="rounded-lg border border-stewart-border bg-stewart-bg/60 p-4">
                    <p className="text-[11px] uppercase tracking-wider text-stewart-muted">What {view.rep} said</p>
                    {no ? (
                      <div className="mt-2"><ObjectionSequence no={no} rep={view.rep} clip={m.clip} angles={view.angles} /></div>
                    ) : m.said ? (
                      m.said.map((ln, i) => <p key={i} className="mt-1 text-sm">{ln.who === "rep" ? view.rep : "customer"}: &ldquo;{ln.line}&rdquo;</p>)
                    ) : m.pick ? (
                      <>
                        <p className="mt-1 text-sm">&ldquo;{m.pick.said}&rdquo; <span className="font-mono text-xs text-stewart-muted">{m.at}</span></p>
                        <p className="mt-2 text-xs text-stewart-muted leading-relaxed"><span className="uppercase tracking-wider text-[10px] text-stewart-accent">Stewart&apos;s read</span> &middot; {m.pick.read}</p>
                      </>
                    ) : null}
                    {!no ? <div className="mt-3"><AudioClip src={m.clip.src} label="Play what happened" /></div> : null}
                    {!no ? <div className="mt-3 rounded-md border px-3 py-2" style={{ borderColor: "#f59e0b", background: "rgba(245,158,11,0.08)" }}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#f59e0b" }}>On this floor</p>
                      <p className="mt-1 text-sm text-stewart-text leading-relaxed">
                        {m.floor.split(/(\d+%)/g).map((piece, i) => /^\d+%$/.test(piece) ? <span key={i} className="font-mono font-bold" style={{ color: "#f59e0b" }}>{piece}</span> : <span key={i}>{piece}</span>)}
                      </p>
                    </div> : null}
                  </div>
                  {view.level >= 2 ? (
                    <div className="rounded-lg border-2 bg-stewart-bg/60 p-4" style={{ borderColor: "#a78bfa", boxShadow: "0 0 0 1px rgba(167,139,250,0.35), 0 0 24px rgba(167,139,250,0.25)" }}>
                      <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#a78bfa" }}>What it could have sounded like</p>
                      <p className="mt-1 text-sm">{view.rep}: &ldquo;{m.text}&rdquo;</p>
                      <p className="mt-1 text-[11px] text-stewart-warning">Synthetic coaching example. {view.rep} never said this &mdash; it is a suggested line rendered in a cloned voice.</p>
                      <div className="mt-3"><AltTake rep={view.rep ?? ""} text={m.text} label={`Hear it in ${view.rep}’s voice`} /></div>
                    </div>
                  ) : null}
                  {withBeyond && beyond ? <BeyondCard beyond={beyond} rep={view.rep} /> : null}
                </div>
              </div>
              );
            })}
          </>
        ) : null}

        {nos.length ? (
          <div className="mt-10">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stewart-accent">Every objection on this call, the same way</p>
            <h2 className="mt-2 text-xl sm:text-2xl font-bold">{nos.length === 1 ? "One objection on this call." : `${nos.length} objections on this call.`} What the customer said, what {view.rep ?? "the rep"} tried, and whether it worked.</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {nos.map((o) => (
                <div key={o.id} className={"rounded-xl border p-4 " + (o.overcome ? "border-stewart-border bg-stewart-card" : "border-stewart-danger/40 bg-stewart-danger/5")}>
                  <p className="text-[11px] uppercase tracking-wider text-stewart-muted mb-2">{o.kind} &middot; {o.at}</p>
                  <ObjectionSequence no={o} rep={view.rep} angles={view.angles} brief={partOf(o.id)} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {(() => {
          const i = tabs.findIndex((t) => t.callId === view.callId);
          const next = i >= 0 && i < tabs.length - 1 ? tabs[i + 1] : null;
          return next ? (
            <Link href={callPath(i + 1)} className="mt-10 block rounded-xl border border-stewart-accent/50 bg-stewart-accent/10 p-5 hover:bg-stewart-accent/15 transition-colors">
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stewart-accent">Next</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold">Call {i + 2}{next.levelTitle ? ` · ${next.levelTitle}` : ""} &rarr;</p>
              <p className="mt-1 text-sm text-stewart-muted">{next.rep} &middot; {next.hook}</p>
            </Link>
          ) : null;
        })()}

        <div className="mt-14 border-t border-white/10 pt-8">
          <p className="text-xl sm:text-2xl font-semibold leading-snug">This is already running on Ion&apos;s data. This is what exists today.</p>
          <p className="mt-2 text-sm text-stewart-muted">{view.corpusCalls} of your calls, read this way.</p>
        </div>
      </div>
    </main>
  );
}

// The third pillar on a level-3 part: one behaviour, exploded outward onto the
// floor — who gets past this no, the moves that set, and the tape.
function BeyondCard({ beyond, rep }: { beyond: Beyond; rep: string | null }) {
  const withTape = beyond.reps.filter((r) => (beyond.clipsByRep[r.rep] ?? []).length > 0);
  const [who, setWho] = useState<string | null>(withTape[0]?.rep ?? null);
  const clips = who ? beyond.clipsByRep[who] ?? [] : [];
  return (
    <div className="rounded-lg border-2 bg-stewart-bg/60 p-4" style={{ borderColor: "#f59e0b", boxShadow: "0 0 0 1px rgba(245,158,11,0.3), 0 0 24px rgba(245,158,11,0.18)" }}>
      <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#f59e0b" }}>Beyond this call</p>
      <p className="mt-1 text-sm font-semibold leading-snug">&ldquo;{beyond.kind}&rdquo; came up {beyond.total} times on this floor. Click a rep to hear how they get past it.</p>
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
                <span className="flex-1 font-semibold truncate">{has ? (active ? "▾ " : "▸ ") : ""}{r.rep}{r.rep === rep ? " (this call)" : ""}</span>
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
            {clips.map((c, i) => (
              <li key={who + i} className="text-xs">
                <p className="text-[11px] text-stewart-muted"><span className="font-mono">{c.at}</span> &middot; {c.angles} {c.angles === 1 ? "angle" : "angles"}: {c.hows.join(", ")}</p>
                <p className="mt-0.5 leading-snug">customer: &ldquo;{c.said}&rdquo;</p>
                <div className="mt-1"><AudioClip src={c.clip.src} label={`Play ${who}`} /></div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-3 flex items-baseline gap-2 text-[10px] uppercase tracking-wider text-stewart-muted border-b border-stewart-border pb-1 mb-1">
        <span className="flex-1">move the rep made</span><span className="w-8 text-right">used</span><span className="w-10 text-right">set</span>
      </div>
      <ul className="text-xs space-y-0.5">
        {beyond.moves.map((v) => (
          <li key={v.how} className="flex items-baseline gap-2"><span className="flex-1 truncate">{v.how}{v.used < 10 ? <span className="text-stewart-muted"> · small sample</span> : null}</span><span className="font-mono text-stewart-muted w-8 text-right">{v.used}</span><span className="font-mono w-10 text-right text-stewart-success">{pct(v.set, v.used)}</span></li>
        ))}
      </ul>
    </div>
  );
}

// The training sequence for an objection, always in this order:
//   the objection → did the rep try → each attempt and whether it moved the
//   customer → how many it took → was it overcome → if not, what works on
//   this floor. One component, used wherever an objection is shown.
export function ObjectionSequence({ no, rep, clip, angles, couldHave, brief }: {
  no: No; rep: string | null; angles: View["angles"];
  clip?: Clip;
  couldHave?: React.ReactNode;
  brief?: boolean; // the no is coached above: show the sequence, skip the floor box
}) {
  const who = rep ?? "the rep";
  const c = clip ?? no.clip;
  const label = no.kind.toLowerCase();
  const count = `${no.angles} ${no.angles === 1 ? "angle" : "angles"}${no.repeats ? `, said it again ×${no.repeats}` : ""}`;

  if (no.overcome) {
    // Overcome: two sentences and the tape. Not every no earns an autopsy.
    return (
      <div className="text-sm leading-relaxed">
        <p>At {no.at} the customer stalls on {label}: &ldquo;{no.said}&rdquo;{no.whereName ? ` — right at ${no.whereName}` : ""}.</p>
        <p className="mt-1">
          {no.tries.map((t, i) => <span key={i}>{i === 0 ? who : `Then ${who}`} {t.how}{t.same ? " (the same line)" : ""}: &ldquo;{t.said}&rdquo; {t.then} </span>)}
          <span className="text-stewart-muted">{count}, and the script went on{no.next ? ` to ${no.next.name} at ${no.next.at}` : ""}.</span>
        </p>
        <div className="mt-2"><AudioClip src={c.src} label="Play it" /></div>
      </div>
    );
  }
  // Not overcome: the full sequence, in sentences.
  return (
    <div className="text-sm leading-relaxed">
      <p>At {no.at} the customer says {label === "other" ? "no" : label}: &ldquo;{no.said}&rdquo;{no.whereName ? ` — right at ${no.whereName}` : ""}.</p>
      <p className="mt-1 font-semibold text-stewart-danger">{no.tried ? `${who} tries to get past it.` : `${who} doesn’t try to get past it.`}</p>
      {no.tries.length ? (
        <ul className="mt-1 space-y-1">
          {no.tries.map((t, i) => <li key={i}>{who} {t.how}{t.same ? " (the same line)" : ""}: &ldquo;{t.said}&rdquo; <span className="text-stewart-muted">{t.then}</span></li>)}
        </ul>
      ) : null}
      <p className="mt-1 text-stewart-muted">{no.tried ? count : "No angles"}. <span className="font-semibold text-stewart-danger">Not overcome</span> &mdash; the script never got past this.</p>
      <div className="mt-2"><AudioClip src={c.src} label="Play it" /></div>
      {brief ? <p className="mt-2 text-xs text-stewart-muted">Coached above: what works on this floor, and the line he could have said.</p> : null}
      {!brief ? <div className="mt-3 rounded-md border px-3 py-2" style={{ borderColor: "#f59e0b", background: "rgba(245,158,11,0.08)" }}>
        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#f59e0b" }}>What works on this floor against &ldquo;{no.kind}&rdquo;</p>
        {no.best ? <p className="mt-1 text-sm">{no.best.how}: {stat(no.best.set, no.best.n)}.</p> : null}
        {angles.one && angles.two ? <p className="mt-1 text-sm">One angle: {stat(angles.one.set, angles.one.n)}. Two: {stat(angles.two.set, angles.two.n)}.</p> : null}
        {couldHave ? <div className="mt-2">{couldHave}</div> : null}
      </div> : null}
    </div>
  );
}

const STATE_WORD: Record<Step["state"], string> = { ran: "ran", partial: "ran, partly", skipped: "skipped", unreached: "never reached" };

function StepCard({ e }: { e: Step }) {
  const ran = e.state === "ran" || e.state === "partial";
  return (
    <>
      <p className="text-[11px] uppercase tracking-wider text-stewart-muted">{e.name} &middot; {STATE_WORD[e.state]}{e.parts ? ` · ${e.parts.score}` : ""}</p>
      {ran ? (
        <>
          <p className="mt-2 text-sm">rep: &ldquo;{e.said}&rdquo; <span className="font-mono text-xs text-stewart-muted">{e.at}{e.end ? `–${e.end}` : ""}</span></p>
          {e.customerSaid ? <p className="mt-1 text-sm text-stewart-muted">customer ({e.customerDid}{e.why ? `, ${e.why}` : ""}): &ldquo;{e.customerSaid}&rdquo;</p> : null}
          {e.then ? <p className="mt-1 text-xs text-stewart-muted">then the rep {e.then}</p> : null}
          {e.parts?.done.length ? <p className="mt-1 text-xs text-stewart-muted">parts done: {e.parts.done.join(", ")}</p> : null}
          {e.clip ? <div className="mt-3"><AudioClip src={e.clip.src} label="Play this section" /></div> : null}
        </>
      ) : (
        <p className="mt-2 text-sm text-stewart-muted">{e.state === "skipped" ? "The call kept going and the rep never ran this." : "The call ended before this point."}</p>
      )}
    </>
  );
}

function MomentCard({ title, at, said, body, clip }: { title: string; at: string | null; said: string | null; body: string; clip: Clip | null }) {
  return (
    <>
      <p className="text-[11px] uppercase tracking-wider text-stewart-muted">{title}</p>
      {said ? <p className="mt-2 text-sm">&ldquo;{said}&rdquo; {at ? <span className="font-mono text-xs text-stewart-muted">{at}</span> : null}</p> : null}
      {body ? <p className="mt-2 text-xs text-stewart-muted leading-relaxed">{body}</p> : null}
      {clip ? <div className="mt-3"><AudioClip src={clip.src} label="Play the moment" /></div> : null}
    </>
  );
}
