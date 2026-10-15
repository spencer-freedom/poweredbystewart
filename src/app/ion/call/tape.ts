import { readFileSync } from "node:fs";
import path from "node:path";
import { clipSrc } from "./clipSign";
import { SHOWCASE } from "./showcase";

// Server-only. The tape behind the "beyond this call" card: for one rep and
// one objection kind, the moments on the floor where that rep faced the
// same no, got past it, and set the appointment. Read on demand by
// /api/ion/beyond, never embedded in a page.

const ION = () => path.join(process.cwd(), "public", "ion");
export function readJson<T>(p: string): T | null {
  try { return JSON.parse(readFileSync(p, "utf-8")) as T; } catch { return null; }
}
export type Row = { call_id: string; slug: string; rep_id: string | null; booked: boolean; duration_min: number | null; objections?: { ts: string | null; start_sec: number | null; end_sec: number | null; quote: string; type: string; moves: string[]; attempts: number; continued: boolean | null }[] };
export const loadRows = (): Row[] => readJson<{ calls: Row[] }>(path.join(ION(), "triage-index.json"))?.calls ?? [];
export const slugOf = (id: string) => (id.toUpperCase().startsWith("SESSION") ? id.toLowerCase() : id);

export const MOVE_LABEL: Record<string, string> = {
  reason: "gave a reason", reframe: "reframed it", question_back: "asked a question back", alternative_offered: "offered an alternative",
  reassure: "reassured", social_proof: "social proof", redirect_to_specialist: "sent it to the specialist", concede: "conceded", restate: "said it again", other: "other",
};
export const words = (t?: string | null) => (t ?? "").replace(/_/g, " ");
export const SECTION_LABEL: Record<string, string> = {
  intro_legitimacy: "Intro", interest_question: "Why solar?", address_homeowner: "Address & owner", co_owner: "Co-owner",
  roof: "Roof", utility_company: "Utility", bill_amount: "Bill amount", tax_credit_qualifier: "Credit / tax", military: "Military",
  prior_design: "Prior design", bill_collection: "Get the bill", appointment_set: "Appointment", button_up: "Button-up",
};
export const OBJ_LABEL: Record<string, string> = {
  cost: "Cost", timing_or_callback: "Not now / call back", trust_or_scam: "Trust", spouse_or_co_decider: "Needs the spouse",
  already_have_quote_or_system: "Already has a quote", not_interested: "Not interested", roof_or_home: "Roof / home", proposal_by_email: "Email me something", other: "Other",
};
// Present tense for the sequence's sentences.
export const MOVE_VERB: Record<string, string> = {
  alternative_offered: "offers another way", reason: "gives a reason", reframe: "reframes it", question_back: "asks a question back", reassure: "reassures",
  social_proof: "points to someone else", redirect_to_specialist: "sends it to the specialist", restate: "says it again", concede: "lets it go", other: "tries something",
};

/** The objection kind a showcase call's level-3 part is about, from the read itself. */
export function beyondTypeFor(callId: string): string | null {
  const show = SHOWCASE[callId];
  const part = show?.level === 3 ? show.misses.find((m) => m.kind === "objection") : null;
  if (!part) return null;
  const brief = readJson<{ objections?: { ts: string; type: string }[] }>(path.join(ION(), "calls", `${slugOf(callId)}-manager-brief.json`));
  return brief?.objections?.find((o) => o.ts === part.ts)?.type ?? null;
}

export type TapeClip = { at: string; said: string; angles: number; hows: string[]; clip: { src: string } };
/** The rep's best three moments against this kind of no: handled, and the call booked. */
export function tapeFor(rows: Row[], type: string, excludeCall: string, rep: string): TapeClip[] {
  const out: TapeClip[] = [];
  for (const r of rows) {
    if (r.rep_id !== rep || r.call_id === excludeCall || !r.booked) continue;
    for (const o of r.objections ?? []) {
      if (o.type !== type || !o.continued || o.attempts < 1 || o.start_sec === null || o.end_sec === null) continue;
      out.push({ at: o.ts ?? "", said: o.quote, angles: o.attempts, hows: o.moves.map((m) => MOVE_LABEL[m] ?? words(m)), clip: { src: clipSrc(r.call_id, o.start_sec, o.end_sec) } });
    }
  }
  return out.sort((a, b) => b.angles - a.angles).slice(0, 3);
}
