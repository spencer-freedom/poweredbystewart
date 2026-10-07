import { readFileSync } from "node:fs";
import path from "node:path";
import { CallAtom, type Beyond, type CallRead, type FloorMoves, type Tab } from "./CallAtom.client";
import { SHOWCASE, SHOWCASE_ORDER } from "./showcase";

// /ion/call — one call, taken apart. Listen to the whole thing, then see
// what Stewart saw: the script as thirteen events, every objection and the
// moves the rep made, the bill, the reason, the outcome — each one a node
// you click to hear. Beside each objection, what works on this floor for
// that objection, and for the moment the rep conceded, the line he could
// have said, in his own voice. Outputs only; nothing here shows how the
// read is produced. Default call is the best "script ran" call in the
// corpus; ?id= opens another.

const ION = () => path.join(process.cwd(), "public", "ion");

// Synchronous on purpose: with the async fs API, Next serialised the raw
// file text into the page's Flight payload (every brief, the whole triage
// index) — readable in the page source. Sync reads leave nothing to serialise.
async function readJson<T>(p: string): Promise<T | null> {
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as T;
  } catch {
    return null;
  }
}

type Row = { call_id: string; slug: string; rep_id: string | null; booked: boolean; duration_min: number | null; objections?: { ts: string | null; start_sec: number | null; end_sec: number | null; quote: string; type: string; moves: string[]; attempts: number; continued: boolean | null }[] };

// Level 3: one behaviour, exploded outward. For the objection type the rep
// faced, every rep's record against it, the moves that set, and the tape of
// the reps who handle it best. Nothing here is a model: counts over the reads.
function beyond(rows: Row[], type: string, excludeCall: string): Beyond {
  const reps: Record<string, { n: number; set: number; continued: number; angles: number }> = {};
  const clipsByRep: Beyond["clipsByRep"] = {};
  for (const r of rows) {
    for (const o of r.objections ?? []) {
      if (o.type !== type) continue;
      const rep = r.rep_id || "Unknown";
      const cell = (reps[rep] ??= { n: 0, set: 0, continued: 0, angles: 0 });
      cell.n += 1; cell.set += r.booked ? 1 : 0; cell.continued += o.continued ? 1 : 0; cell.angles += o.attempts;
      // the tape worth hearing: the same no, handled, and the appointment set
      if (r.call_id !== excludeCall && r.booked && o.continued && o.attempts >= 1 && o.start_sec !== null && o.end_sec !== null && r.rep_id) {
        (clipsByRep[r.rep_id] ??= []).push({ call_id: r.call_id, rep: r.rep_id, ts: o.ts ?? "", start_sec: o.start_sec, end_sec: o.end_sec, quote: o.quote, moves: o.moves, attempts: o.attempts });
      }
    }
  }
  for (const rep of Object.keys(clipsByRep)) clipsByRep[rep] = clipsByRep[rep].sort((a, b) => b.attempts - a.attempts).slice(0, 3);
  const ranked = Object.entries(reps).filter(([rep, v]) => rep !== "Unknown" && v.n >= 3).map(([rep, v]) => ({ rep, ...v, set_rate: v.set / v.n })).sort((a, b) => b.set_rate - a.set_rate || b.n - a.n);
  return { type, reps: ranked, clipsByRep, total: Object.values(reps).reduce((n, v) => n + v.n, 0) };
}

function floorMoves(rows: Row[]): FloorMoves {
  const byType: FloorMoves["byType"] = {};
  const all: FloorMoves["all"] = {};
  for (const r of rows) {
    for (const o of r.objections ?? []) {
      const t = (byType[o.type] ??= {});
      for (const m of new Set(o.moves)) {
        const cell = (t[m] ??= { used: 0, set: 0, continued: 0 });
        cell.used += 1;
        cell.set += r.booked ? 1 : 0;
        cell.continued += o.continued ? 1 : 0;
        const a = (all[m] ??= { used: 0, set: 0, continued: 0 });
        a.used += 1;
        a.set += r.booked ? 1 : 0;
        a.continued += o.continued ? 1 : 0;
      }
    }
  }
  return { byType, all, byAngles: {} };
}

// Each call has its own path (/ion/call, /ion/call2, /ion/call3) so the page can
// be fetched without a query string or a click; ?id= still works on /ion/call.
export async function renderCall(callId: string) {
  const slug = callId.toUpperCase().startsWith("SESSION") ? callId.toLowerCase() : callId;
  const [brief, picks, qc, index, stats] = await Promise.all([
    readJson<CallRead["brief"]>(path.join(ION(), "calls", `${slug}-manager-brief.json`)),
    readJson<CallRead["picks"]>(path.join(ION(), "calls", `${slug}-cherrypicks.json`)),
    readJson<CallRead["quotes"]>(path.join(ION(), "calls", `${slug}-quote-check.json`)),
    readJson<{ calls: Row[] }>(path.join(ION(), "triage-index.json")),
    readJson<{ calls: number; objections?: { set_rate_by_max_attempts?: Record<string, { set: number; n: number; set_rate: number | null }> } }>(path.join(ION(), "corpus-stats.json")),
  ]);
  if (!brief) {
    return <main className="min-h-screen bg-black text-stewart-text p-10">No read for call {callId}.</main>;
  }
  const row = index?.calls.find((r) => r.call_id === callId || r.slug === slug) ?? null;
  // Display projection. The page's embedded data is readable in the page
  // source, so the read is reduced to what the screen shows: classification
  // names become plain labels, reasoning fields and rule stamps are dropped.
  const CLS: Record<string, string> = {
    curiosity_creation_failure: "the reason, filed instead of used", unanchored_soft_exit: "ended without a next step",
    objection_inversion_miss: "an objection taken at face value", setter_scope_creep: "the setter started closing",
    intro_legitimacy_omission: "opened without saying who or why", prior_contact_probe_miss: "a prior quote, not probed",
    non_standard_scenario_hold: "put on hold for a non-standard case", softener_overuse: "softeners",
    enthusiasm_signal: "a buying signal", protocol_violation: "a step out of order", knowledge_gap: "a question he couldn\u2019t answer",
    bill_anchor: "the bill", rapport_repair: "rapport repaired", micro_trade: "a small trade", cross_sell_miss: "a cross-sell walked past",
    conditional_booking: "a booking with a condition on it", empathy_miss: "a disclosure walked past", spouse_handling: "the spouse",
    tesla_expectation_gap: "an expectation gap", other: "a moment",
  };
  // No internal keys in generated prose: dotted schema paths and snake_case become plain words.
  const plainText = (t?: string | null) => (t ?? "")
    .replace(/\s*\(?\b(?:per|see|from|via)\s+[a-z_]+(?:\.[a-z_]+)+\)?/gi, "")
    .replace(/\b[a-z_]+(?:\.[a-z_]+)+\b/g, (m) => m.split(".").pop()!.replace(/_/g, " "))
    .replace(/\b([a-z]+_[a-z_]+)\b/g, (m) => m.replace(/_/g, " "))
    .replace(/\s{2,}/g, " ").replace(/\s+([,.;])/g, "$1").trim();
  const strip = <T extends Record<string, unknown>>(o: T | null | undefined, keys: string[]): T | null => {
    if (!o) return null;
    const c = { ...o } as Record<string, unknown>;
    for (const k of keys) delete c[k];
    return c as T;
  };
  const b = brief as Record<string, unknown>;
  const shownBrief = {
    rep_name: brief.rep_name,
    shape: brief.shape,
    observed_outcome: strip(brief.observed_outcome as Record<string, unknown> | null, ["set_conditions", "set_rule", "reasoning", "set_strength"]),
    bill_anchor_audit: strip(brief.bill_anchor_audit as Record<string, unknown> | null, ["reasoning"]),
    bill_document_audit: strip(brief.bill_document_audit as Record<string, unknown> | null, ["reasoning"]),
    interest_reason_audit: strip(brief.interest_reason_audit as Record<string, unknown> | null, ["reasoning"]),
    script_coverage: brief.script_coverage,
    objections: (brief.objections ?? []).map((o) => strip(o as unknown as Record<string, unknown>, ["reasoning", "resolution_agrees", "rep_attempts_model", "moves_mismatch"])),
    primary_coaching_focus: brief.primary_coaching_focus
      ? { ...brief.primary_coaching_focus, topic: plainText(brief.primary_coaching_focus.topic), why: plainText(brief.primary_coaching_focus.why) }
      : null,
    trajectory_summary: plainText(brief.trajectory_summary),
  } as unknown as CallRead["brief"];
  if ((brief.observed_outcome as { set_strength?: string } | null)?.set_strength) {
    (shownBrief.observed_outcome as { set_strength?: string | null }).set_strength = (brief.observed_outcome as { set_strength?: string }).set_strength;
  }
  void b;
  const read: CallRead = {
    callId,
    rep: brief.rep_name ?? row?.rep_id ?? null,
    durationMin: row?.duration_min ?? null,
    brief: shownBrief,
    picks: (picks ?? []).map((pk) => ({ ts: pk.ts, quote: pk.quote, classification: CLS[pk.classification] ?? pk.classification.replace(/_/g, " "), stewart_read: plainText(pk.stewart_read) })),
    quotes: qc ? { checked: qc.checked, verified: qc.verified, fuzzy: qc.fuzzy, wrong_ts: qc.wrong_ts, not_found: qc.not_found } : null,
    corpusCalls: stats?.calls ?? index?.calls.length ?? 0,
  };
  const floor = floorMoves(index?.calls ?? []);
  floor.byAngles = stats?.objections?.set_rate_by_max_attempts ?? {};
  const tabs: Tab[] = [];
  for (const cid of SHOWCASE_ORDER) {
    const r = index?.calls.find((x) => x.call_id === cid) ?? null;
    const bslug = cid.toUpperCase().startsWith("SESSION") ? cid.toLowerCase() : cid;
    const tb = await readJson<{ rep_name?: string | null; observed_outcome?: { outcome: string } | null }>(path.join(ION(), "calls", `${bslug}-manager-brief.json`));
    tabs.push({ callId: cid, rep: tb?.rep_name ?? r?.rep_id ?? null, durationMin: r?.duration_min ?? null, outcome: tb?.observed_outcome?.outcome ?? null, hook: SHOWCASE[cid].hook });
  }
  const show = SHOWCASE[callId];
  let beyondData: Beyond | null = null;
  const objPart = show?.level === 3 ? show.misses.find((m) => m.kind === "objection") : null;
  if (objPart) {
    const o = (brief.objections ?? []).find((x) => x.ts === objPart.ts);
    if (o) beyondData = beyond(index?.calls ?? [], o.type, callId);
  }
  // Keyed by call so switching calls resets every player and selection — nothing auto-plays on arrival.
  return <CallAtom key={callId} read={read} floor={floor} tabs={tabs} beyond={beyondData} />;
}
