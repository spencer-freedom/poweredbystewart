import { promises as fs } from "node:fs";
import path from "node:path";

// Server-side readers for the published corpus files. The deck's numbers
// come from here — never from literals — so a re-run changes the slides.

export type CorpusStats = {
  calls: number;
  gated_out_voicemail_or_short: number;
  cost_usd: number;
  bill: { captured: number; flipped: number; not_flipped: number; no_bill_captured: number; flip_rate_of_captured: number };
  interest_reason: { asked: number; not_asked: number; reason_given: number; used: number; not_used: number; use_rate_of_given: number };
  outcomes: Record<string, number>;
  shapes: Record<string, number>;
  critic_verdicts: Record<string, number>;
  quotes: { checked: number; verified: number; fuzzy: number; wrong_ts: number; not_found: number; grounded_rate: number; calls_fully_grounded: number };
  script_coverage: Record<string, { asked: number; skipped: number; not_reached: number; asked_rate: number; asked_rate_of_reached: number | null }>;
  outcome_definition?: string;
  set?: { n: number; rate: number | null };
  funnel?: {
    floor: { calls: number; sections: Record<string, { on_line: number; ran: number; ran_rate_of_on_line: number | null }> };
    reps: Record<string, { calls: number; sections: Record<string, { on_line: number; ran: number; ran_rate_of_on_line: number | null }> }>;
  };
  bill_document?: { measured_on: number; results: Record<string, number> };
  talk?: {
    measured_on: number; speaker_balance_suspect: number; rep_talk_share_median: number | null;
    rep_talk_share_set_vs_not: { set: number | null; not_set: number | null };
    longest_monologue_median_words: number | null; softeners_per_100_words_median: number | null;
    credit_threshold_stated: Record<string, number>;
  };
  time_to_bill_vs_set?: Record<string, { set: number; n: number; set_rate: number | null }>;
  objections?: {
    calls_with_objections: number; by_type: Record<string, number>; attempts_histogram: Record<string, number>;
    resolved_rate_by_attempts: Record<string, { resolved: number; n: number; rate: number | null }>;
    set_rate_by_max_attempts: Record<string, { set: number; n: number; set_rate: number | null }>;
  };
  script_events?: Record<string, { customer_response: Record<string, number>; resistance_reasons: Record<string, number>; results: Record<string, number>; rep_followup: Record<string, number>; set_rate_by_result: Record<string, { set: number; n: number; set_rate: number | null }> }>;
  adherence_vs_outcome?: {
    min_n: number;
    sections: Record<string, { ran_n: number; ran_set_rate: number | null; skipped_n: number; skipped_set_rate: number | null; lift_pts: number | null; small_sample: boolean }>;
    anchors: Record<string, { set: number; n: number; set_rate: number | null }>;
  };
  reps: Record<string, {
    calls: number; set?: number; set_rate?: number | null; bill_captured: number; bill_flipped: number;
    reason_asked: number; reason_given?: number; reason_used: number; booked?: number;
    coverage?: Record<string, { asked: number; skipped: number; not_reached: number; asked_rate_of_reached: number | null }>;
  }>;
};

const ION = () => path.join(process.cwd(), "public", "ion");

export async function loadCorpusStats(): Promise<CorpusStats | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(ION(), "corpus-stats.json"), "utf-8")) as CorpusStats;
  } catch {
    return null;
  }
}

export async function loadCallJson<T>(slug: string, kind: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(ION(), "calls", `${slug}-${kind}.json`), "utf-8")) as T;
  } catch {
    return null;
  }
}

export const SCRIPT_SECTIONS: { key: string; label: string }[] = [
  { key: "intro_legitimacy", label: "Intro — who we are, why we're calling" },
  { key: "interest_question", label: "“What has you interested in solar?”" },
  { key: "address_homeowner", label: "Address & homeowner" },
  { key: "co_owner", label: "Anyone else on the title?" },
  { key: "roof", label: "Roof type & age" },
  { key: "utility_company", label: "Utility company" },
  { key: "bill_amount", label: "Average monthly bill" },
  { key: "tax_credit_qualifier", label: "Income tax + credit qualifier" },
  { key: "military", label: "Military" },
  { key: "prior_design", label: "Seen a solar design before?" },
  { key: "bill_collection", label: "Bill — mail or online, text or email" },
  { key: "appointment_set", label: "Appointment — day and time" },
  { key: "button_up", label: "Button-up" },
];
