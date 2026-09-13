// Mirrors scripts/build_ion_triage.py → public/ion/triage-index.json

export type TriageComponents = {
  leak: number;
  fragile: number;
  protocol: number;
  bill: number;
  signals: number;
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

export type TriageIndex = {
  version: string;
  default_weights: TriageComponents;
  weight_labels: Record<keyof TriageComponents, string>;
  total_calls: number;
  reps: { rep_id: string; calls: number }[];
  calls: TriageRow[];
};
