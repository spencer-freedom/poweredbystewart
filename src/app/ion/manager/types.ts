// Mirrors scripts/build_ion_triage.py → public/ion/triage-index.json

export type TriageComponents = {
  leak: number;
  fragile: number;
  protocol: number;
  bill: number;
  signals: number;
};

// One objection on one call (layered pipeline). `continued` = the tape shows a
// verified script event after it; `resolved` = Stewart's read that the
// customer moved past it; the call's `booked` says whether it set.
export type ObjectionRow = {
  ts: string | null;
  start_sec: number | null;
  end_sec: number | null;
  quote: string;
  type: string;
  blocked_section: string | null;
  attempts: number;
  moves: string[];
  attempt_quotes: string[];
  resolved: boolean;
  continued: boolean | null;
  next_event: string | null;
};

export type TriageRow = {
  call_id: string;
  slug: string;
  rep_id: string | null;
  duration_min: number | null;
  outcome: string | null;
  booked: boolean;
  shape: string | null;
  is_hero: boolean;
  tagline: string | null;
  headline: string | null;
  why: string;
  focus: { topic: string | null; ts: string | null; quote: string | null } | null;
  unresolved_concerns: number;
  bill_flip: "flipped" | "not_flipped" | "no_bill" | "unclear";
  // measured (pipeline v3.1)
  observed_outcome: string | null;
  reason_asked: boolean | null;
  reason_used: "yes" | "no" | "no_reason_given" | null;
  coverage: Record<string, "asked" | "skipped" | "not_reached">;
  objections: ObjectionRow[];
  counts: {
    moments: number;
    protocol_violation: number;
    knowledge_gap: number;
    enthusiasm_signal: number;
    empathy_miss: number;
    bill_anchor: number;
  };
  critic: { verdict: string | null; flags: number };
  quotes: { checked: number | null; verified: number | null; grounded: boolean | null };
  components: TriageComponents;
  share: boolean;
  score: number;
};

// Exemplar retrieval (build_ion_triage.py → exemplars): per script section,
// the reps who run it most and the clips a manager should hand a rep.
export type ExemplarClip = {
  call_id: string;
  slug: string;
  rep: string | null;
  ts: string;
  start_sec: number;
  end_sec: number;
  quote: string;
  customer_quote: string;
  customer_response: string | null;
  rep_followup: string | null;
  set: boolean;
  tier: 1 | 2 | 3;
  score: number;
};
export type ExemplarBestRep = {
  rep: string;
  rate: number;
  ran: number;
  reached: number;
  set_rate_when_ran: number | null;
};
export type ExemplarSection = {
  label: string;
  best_reps: ExemplarBestRep[];
  clips: ExemplarClip[];
  pool: number;
};

export type TriageIndex = {
  version: string;
  default_weights: TriageComponents;
  weight_labels: Record<keyof TriageComponents, string>;
  total_calls: number;
  reps: { rep_id: string; calls: number }[];
  sections: { key: string; label: string }[];
  exemplars: Record<string, ExemplarSection>;
  calls: TriageRow[];
};
