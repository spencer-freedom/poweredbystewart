import { readFileSync } from "node:fs";
import path from "node:path";
import { CallAtom, type Beyond, type Clip, type No, type Note, type Part, type Result, type Step, type Tab, type Try, type View } from "./CallAtom.client";
import { clipSrc } from "./clipSign";
import { SHOWCASE, SHOWCASE_ORDER } from "./showcase";

// /ion/call — one call, taken apart. Listen to the whole thing, then see
// what Stewart saw: the script as thirteen events, every objection and the
// moves the rep made, the bill, the reason, the outcome — each one a node
// you click to hear. Beside each objection, what works on this floor for
// that objection, and for the moment the rep conceded, the line he could
// have said, in his own voice. Outputs only; nothing here shows how the
// read is produced.
//
// This file is the only place the read's own vocabulary exists on the
// public path. It turns the read into a View: plain words, neutral keys,
// and signed clip URLs. The client gets the View and nothing else.

const ION = () => path.join(process.cwd(), "public", "ion");

// Synchronous on purpose: with the async fs API, Next serialised the raw
// file text into the page's Flight payload (every brief, the whole triage
// index) — readable in the page source. Sync reads leave nothing to serialise.
function readJson<T>(p: string): T | null {
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as T;
  } catch {
    return null;
  }
}

type RawEvent = {
  section: string; status: string; ts: string; end_ts?: string; quote?: string; result?: string;
  customer_response?: string; customer_quote?: string; resistance_reason?: string; rep_followup?: string;
  parts_score?: string; parts_done?: string[];
};
type RawObjection = {
  ts: string; quote: string; type: string; blocked_section?: string; rep_attempts?: number; rep_restates?: number;
  attempt_quotes?: string[]; attempt_moves?: string[]; attempt_kinds?: string[]; attempt_results?: string[];
  resolved_by_tape?: boolean; next_event?: string | null; resolution_ts?: string | null;
};
type RawBrief = {
  rep_name?: string | null; trajectory_summary?: string;
  observed_outcome?: { outcome: string; ts?: string | null; quote?: string | null; set_strength?: string | null } | null;
  bill_anchor_audit?: { bill_captured: boolean; bill_ts?: string; bill_quote?: string | null; flip_executed?: string } | null;
  bill_document_audit?: { asked: boolean; ask_ts?: string; ask_quote?: string | null; result?: string; method?: string; result_ts?: string; result_quote?: string | null } | null;
  interest_reason_audit?: { reason_given: boolean; reason_ts?: string; reason_quote?: string | null; reason_used?: string } | null;
  script_coverage?: RawEvent[];
  objections?: RawObjection[];
  primary_coaching_focus?: { topic: string; ts: string; quote: string; why: string } | null;
};
type RawPick = { ts: string; quote: string; classification: string; stewart_read: string };
type RawQuotes = { checked: number; verified: number; fuzzy: number; wrong_ts: number; not_found: number };
type Row = { call_id: string; slug: string; rep_id: string | null; booked: boolean; duration_min: number | null; objections?: { ts: string | null; start_sec: number | null; end_sec: number | null; quote: string; type: string; moves: string[]; attempts: number; continued: boolean | null }[] };
type Stats = { calls: number; objections?: { set_rate_by_max_attempts?: Record<string, { set: number; n: number }> } };

const SECTION_LABEL: Record<string, string> = {
  intro_legitimacy: "Intro", interest_question: "Why solar?", address_homeowner: "Address & owner", co_owner: "Co-owner",
  roof: "Roof", utility_company: "Utility", bill_amount: "Bill amount", tax_credit_qualifier: "Credit / tax", military: "Military",
  prior_design: "Prior design", bill_collection: "Get the bill", appointment_set: "Appointment", button_up: "Button-up",
};
const OBJ_LABEL: Record<string, string> = {
  cost: "Cost", timing_or_callback: "Not now / call back", trust_or_scam: "Trust", spouse_or_co_decider: "Needs the spouse",
  already_have_quote_or_system: "Already has a quote", not_interested: "Not interested", roof_or_home: "Roof / home", proposal_by_email: "Email me something", other: "Other",
};
// Past tense for tables, present tense for the sequence's sentences.
const MOVE_LABEL: Record<string, string> = {
  reason: "gave a reason", reframe: "reframed it", question_back: "asked a question back", alternative_offered: "offered an alternative",
  reassure: "reassured", social_proof: "social proof", redirect_to_specialist: "sent it to the specialist", concede: "conceded", restate: "said it again", other: "other",
};
const MOVE_VERB: Record<string, string> = {
  alternative_offered: "offers another way", reason: "gives a reason", reframe: "reframes it", question_back: "asks a question back", reassure: "reassures",
  social_proof: "points to someone else", redirect_to_specialist: "sends it to the specialist", restate: "says it again", concede: "lets it go", other: "tries something",
};
const RESULT_LABEL: Record<string, string> = { customer_moved: "The customer moves.", customer_held: "The customer holds.", customer_pushed_back: "The customer pushes back.", call_ended: "The call ends." };
const OUTCOME_LABEL: Record<string, string> = { booked: "Booked", tentative: "Tentative", callback: "Callback", no_appointment: "No appointment", dq: "Disqualified", no_contact: "No contact" };

const sec = (ts?: string | null) => { if (!ts) return null; const [m, s] = ts.split(":").map((x) => parseInt(x, 10) || 0); return (m || 0) * 60 + (s || 0); };
const words = (t?: string | null) => (t ?? "").replace(/_/g, " ");
// Generated prose never shows internal keys: dotted schema paths and
// snake_case names become plain words, and "per <path>" clauses drop.
const plainText = (t?: string | null) => (t ?? "")
  .replace(/\s*\(?\b(?:per|see|from|via)\s+[a-z_]+(?:\.[a-z_]+)+\)?/gi, "")
  .replace(/\b[a-z_]+(?:\.[a-z_]+)+\b/g, (m) => m.split(".").pop()!.replace(/_/g, " "))
  .replace(/\b([a-z]+_[a-z_]+)\b/g, (m) => m.replace(/_/g, " "))
  .replace(/\s{2,}/g, " ").replace(/\s+([,.;])/g, "$1").trim();

// The clip for an objection runs until it was overcome: through the customer
// moving AND the script moving on, then a tail so the line that lands it is
// heard in full; at least 25 s, at most 2 min. Same rule as the triage builder.
function objectionWindow(o: RawObjection): { start: number; end: number } {
  const t = sec(o.ts) ?? 0;
  const ends: number[] = [];
  const r = sec(o.resolution_ts ?? null); if (r !== null && r > t) ends.push(r);
  const nx = o.next_event && o.next_event.includes("@") ? sec(o.next_event.split("@")[1]) : null; if (nx !== null && nx > t) ends.push(nx);
  const end = (ends.length ? Math.max(...ends) : t + 15) + 10;
  return { start: Math.max(0, t - 5), end: Math.min(Math.max(end, t + 25), t + 120) };
}

type MoveCell = { used: number; set: number };
function floorByType(rows: Row[]): Record<string, Record<string, MoveCell>> {
  const byType: Record<string, Record<string, MoveCell>> = {};
  for (const r of rows) {
    for (const o of r.objections ?? []) {
      const t = (byType[o.type] ??= {});
      for (const m of new Set(o.moves)) {
        const cell = (t[m] ??= { used: 0, set: 0 });
        cell.used += 1;
        cell.set += r.booked ? 1 : 0;
      }
    }
  }
  return byType;
}
const bestMove = (typed: Record<string, MoveCell>) =>
  Object.entries(typed).filter(([, v]) => v.used >= 3).sort((a, b) => b[1].set / b[1].used - a[1].set / a[1].used)[0] ?? null;

// Level 3: one behaviour, exploded outward. For the objection type the rep
// faced, every rep's record against it, the moves that set, and the tape of
// the reps who handle it best. Nothing here is a model: counts over the reads.
function beyond(rows: Row[], type: string, excludeCall: string, typed: Record<string, MoveCell>): Beyond {
  const reps: Record<string, { n: number; set: number; angles: number }> = {};
  const clipsByRep: Record<string, { at: string; said: string; angles: number; hows: string[]; clip: Clip }[]> = {};
  for (const r of rows) {
    for (const o of r.objections ?? []) {
      if (o.type !== type) continue;
      const rep = r.rep_id || "Unknown";
      const cell = (reps[rep] ??= { n: 0, set: 0, angles: 0 });
      cell.n += 1; cell.set += r.booked ? 1 : 0; cell.angles += o.attempts;
      // the tape worth hearing: the same no, handled, and the appointment set
      if (r.call_id !== excludeCall && r.booked && o.continued && o.attempts >= 1 && o.start_sec !== null && o.end_sec !== null && r.rep_id) {
        (clipsByRep[r.rep_id] ??= []).push({ at: o.ts ?? "", said: o.quote, angles: o.attempts, hows: o.moves.map((m) => MOVE_LABEL[m] ?? words(m)), clip: { src: clipSrc(r.call_id, o.start_sec, o.end_sec) } });
      }
    }
  }
  for (const rep of Object.keys(clipsByRep)) clipsByRep[rep] = clipsByRep[rep].sort((a, b) => b.angles - a.angles).slice(0, 3);
  const ranked = Object.entries(reps).filter(([rep, v]) => rep !== "Unknown" && v.n >= 3).map(([rep, v]) => ({ rep, ...v })).sort((a, b) => b.set / b.n - a.set / a.n || b.n - a.n);
  const moves = Object.entries(typed).filter(([, v]) => v.used >= 3).sort((a, b) => b[1].set / b[1].used - a[1].set / a[1].used).slice(0, 4).map(([m, v]) => ({ how: MOVE_LABEL[m] ?? words(m), used: v.used, set: v.set }));
  return { kind: OBJ_LABEL[type] ?? words(type), total: Object.values(reps).reduce((n, v) => n + v.n, 0), reps: ranked, clipsByRep, moves };
}

// Each call has its own path (/ion/call, /ion/call2, /ion/call3) so the page can
// be fetched without a query string or a click; ?id= still works on /ion/call.
export async function renderCall(callId: string) {
  const slugOf = (id: string) => (id.toUpperCase().startsWith("SESSION") ? id.toLowerCase() : id);
  const slug = slugOf(callId);
  const brief = readJson<RawBrief>(path.join(ION(), "calls", `${slug}-manager-brief.json`));
  const picks = readJson<RawPick[]>(path.join(ION(), "calls", `${slug}-cherrypicks.json`)) ?? [];
  const qc = readJson<RawQuotes>(path.join(ION(), "calls", `${slug}-quote-check.json`));
  const index = readJson<{ calls: Row[] }>(path.join(ION(), "triage-index.json"));
  const stats = readJson<Stats>(path.join(ION(), "corpus-stats.json"));
  if (!brief) {
    return <main className="min-h-screen bg-black text-stewart-text p-10">No read for call {callId}.</main>;
  }
  const rows = index?.calls ?? [];
  const row = rows.find((r) => r.call_id === callId || r.slug === slug) ?? null;
  const show = SHOWCASE[callId] ?? null;
  const clip = (start: number, end: number): Clip => ({ src: clipSrc(callId, start, end) });
  const around = (ts?: string | null, before = 4, after = 20): Clip | null => { const s = sec(ts); return s === null ? null : clip(Math.max(0, s - before), s + after); };
  const typedAll = floorByType(rows);

  const events = brief.script_coverage ?? [];
  const steps: Step[] = events.map((e, i) => {
    const s = sec(e.ts);
    const ran = e.status === "asked";
    return {
      id: `s${i}`, name: SECTION_LABEL[e.section] ?? words(e.section), at: e.ts || null, end: e.end_ts ?? null,
      state: ran ? (e.result === "completed" ? "ran" : "partial") : e.status === "skipped" ? "skipped" : "unreached",
      said: ran ? e.quote ?? null : null, customerSaid: ran ? e.customer_quote ?? null : null,
      customerDid: ran && e.customer_response ? words(e.customer_response) : null, why: ran && e.resistance_reason ? words(e.resistance_reason) : null,
      then: ran && e.rep_followup && e.rep_followup !== "none" && e.rep_followup !== "n_a" ? words(e.rep_followup) : null,
      parts: e.parts_score ? { score: e.parts_score, done: (e.parts_done ?? []).map((p) => words(p)) } : null,
      clip: ran && s !== null ? clip(Math.max(0, s - 3), (sec(e.end_ts) ?? s + 15) + 3) : null,
    };
  });

  const nos: No[] = (brief.objections ?? []).map((o, i) => {
    const quotes = o.attempt_quotes ?? [], moves = o.attempt_moves ?? [], kinds = o.attempt_kinds ?? [], results = o.attempt_results ?? [];
    const overcome = !!o.resolved_by_tape;
    const tries: Try[] = quotes.map((q, j) => ({
      said: q, how: MOVE_VERB[moves[j] ?? "other"] ?? "tries something", same: kinds[j] === "restate",
      then: RESULT_LABEL[results[j] ?? ""] ?? (j === quotes.length - 1 ? (overcome ? "The customer moves." : moves[j] === "concede" ? "And that’s the end of it." : "The customer holds.") : "The customer holds."),
    }));
    const whereIdx = events.findIndex((e) => e.section === o.blocked_section);
    const w = objectionWindow(o);
    const next = o.next_event && o.next_event.includes("@") ? o.next_event.split("@") : null;
    const best = bestMove(typedAll[o.type] ?? {});
    return {
      id: `n${i}`, at: o.ts, said: o.quote, kind: OBJ_LABEL[o.type] ?? words(o.type),
      where: whereIdx >= 0 ? `s${whereIdx}` : null, whereName: whereIdx >= 0 ? steps[whereIdx].name : null,
      angles: o.rep_attempts ?? 0, repeats: o.rep_restates ?? 0, tried: quotes.some((_, j) => moves[j] !== "concede"), tries, overcome,
      next: next ? { name: SECTION_LABEL[next[0]] ?? words(next[0]), at: next[1] } : null,
      clip: clip(w.start, w.end),
      best: best ? { how: MOVE_LABEL[best[0]] ?? words(best[0]), set: best[1].set, n: best[1].used } : null,
    };
  });

  const notes: Note[] = [];
  const ba = brief.bill_anchor_audit, bd = brief.bill_document_audit, ir = brief.interest_reason_audit;
  if (ba?.bill_captured) notes.push({ id: "a:bill", label: "Bill amount", at: ba.bill_ts ?? null, good: ba.flip_executed === "yes", title: `Bill amount captured${ba.flip_executed === "yes" ? ", and used" : ", never used as the reason to act"}`, said: ba.bill_quote ?? null, clip: around(ba.bill_ts) });
  if (bd?.asked) notes.push({ id: "a:doc", label: `Bill: ${words(bd.result)}`, at: bd.result_ts || bd.ask_ts || null, good: bd.result === "received_on_call", title: `The bill itself: ${words(bd.result)}${bd.method && bd.method !== "none" ? ` by ${words(bd.method)}` : ""}`, said: bd.result_quote || bd.ask_quote || null, clip: around(bd.result_ts || bd.ask_ts) });
  if (ir?.reason_given) notes.push({ id: "a:reason", label: "The reason", at: ir.reason_ts ?? null, good: ir.reason_used === "yes", title: `The reason${ir.reason_used === "yes" ? ", used later" : ", never used again"}`, said: ir.reason_quote ?? null, clip: around(ir.reason_ts) });

  const oo = brief.observed_outcome ?? null;
  const result: Result | null = oo ? {
    label: OUTCOME_LABEL[oo.outcome] ?? words(oo.outcome), at: oo.ts ?? null, said: oo.quote ?? null,
    tone: oo.outcome === "booked" ? "good" : oo.outcome === "tentative" ? "warn" : "flat", billInHand: oo.set_strength === "set_with_bill", clip: around(oo.ts),
  } : null;

  const pf = brief.primary_coaching_focus ?? null;
  const focus = pf ? { title: show?.focus.title ?? plainText(pf.topic), at: pf.ts, said: pf.quote, why: show?.focus.why ?? plainText(pf.why), clip: around(pf.ts) } : null;

  const parts: Part[] = (show?.misses ?? []).map((m) => {
    const at = sec(m.ts) ?? 0;
    const no = m.kind === "objection" ? nos.find((o) => o.at === m.ts) ?? null : null;
    const pk = picks.find((p) => p.ts === m.ts) ?? null;
    return {
      title: m.title, why: m.why, text: m.text, floor: m.floor, at: m.ts, noId: no?.id ?? null,
      said: m.said ?? null, pick: pk ? { said: pk.quote, read: plainText(pk.stewart_read) } : null,
      clip: m.clip ? clip(m.clip.start, m.clip.end) : no ? no.clip : clip(Math.max(0, at - 4), at + 26),
    };
  });
  const winSec = show ? sec(show.win.ts) ?? 0 : 0;

  const tabs: Tab[] = SHOWCASE_ORDER.map((cid) => {
    const r = rows.find((x) => x.call_id === cid) ?? null;
    const tb = readJson<RawBrief>(path.join(ION(), "calls", `${slugOf(cid)}-manager-brief.json`));
    const out = tb?.observed_outcome?.outcome;
    return { callId: cid, rep: tb?.rep_name ?? r?.rep_id ?? null, durationMin: r?.duration_min ?? null, outcome: out ? OUTCOME_LABEL[out] ?? words(out) : null, hook: SHOWCASE[cid].hook, levelTitle: SHOWCASE[cid].levelTitle };
  });

  let beyondData: Beyond | null = null;
  const objPart = show?.level === 3 ? show.misses.find((m) => m.kind === "objection") : null;
  if (objPart) {
    const o = (brief.objections ?? []).find((x) => x.ts === objPart.ts);
    if (o) beyondData = beyond(rows, o.type, callId, typedAll[o.type] ?? {});
  }
  const byAngles = stats?.objections?.set_rate_by_max_attempts ?? {};
  const cell = (k: string) => (byAngles[k] ? { set: byAngles[k].set, n: byAngles[k].n } : null);

  const view: View = {
    callId, fullSrc: `/api/ion/audio-clip/${encodeURIComponent(callId)}`,
    rep: brief.rep_name ?? row?.rep_id ?? null, durationMin: row?.duration_min ?? null, corpusCalls: stats?.calls ?? rows.length,
    checked: qc ? { ok: qc.verified + qc.fuzzy, total: qc.checked } : null,
    level: show?.level ?? 1, levelTitle: show?.levelTitle ?? "", summary: show?.summary ?? plainText(brief.trajectory_summary),
    focus, win: show ? { title: show.win.title, why: show.win.why, at: show.win.ts, clip: clip(Math.max(0, winSec - 4), winSec + 26) } : null,
    parts, steps, nos, notes, result, angles: { one: cell("1"), two: cell("2") }, beyond: beyondData, tabs,
  };
  // Keyed by call so switching calls resets every player and selection — nothing auto-plays on arrival.
  return <CallAtom key={callId} view={view} />;
}
