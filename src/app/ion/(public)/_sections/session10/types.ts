// Type shapes for the SESSION10 / SESSION18 demo cards.
// Loaded from public/ion/*.json at request time by the Section2 server
// component; passed to the interactive client component as props.

export type KeyMoment = {
  ts: string;
  quote: string;
  classification: string;
  stewart_read: string;
};

export type ManagerBrief = {
  call_id: string;
  trajectory_summary: string;
  shape: "energy_built" | "energy_leaked" | "mixed" | "stagnant" | string;
  outcome_dispute: string | null;
  primary_coaching_focus: {
    topic: string;
    ts: string;
    quote: string;
    why: string;
  };
  key_moments: KeyMoment[];
};

export type CherryPick = {
  ts: string;
  quote: string;
  classification: string;
  codex_reference: string | null;
  stewart_read: string;
  alternative_hypothesis: string | null;
  coaching_implication: string;
};

export type Metadata = {
  call_id: string;
  tenant_id: string;
  rep_id: string;
  demo_role: string;
  duration_min: number;
  duration_seconds: number;
  outcome: string;
  qualification_status: string;
  primary_objection: string;
  audio_storage_key: string;
  cohort?: string;
};

export type Handoff = {
  applicable: boolean;
  customer_anxiety_profile: string;
  unresolved_concerns: string[];
  sensitive_topics_raised: string[];
  exact_promises_rep_made: string[];
  closer_should_know: string;
};

export type CallBundle = {
  metadata: Metadata;
  managerBrief: ManagerBrief;
  cherryPicks: CherryPick[];
  handoff?: Handoff;
};

export function tsToSeconds(ts: string): number {
  const [m, s] = ts.split(":").map((v) => parseInt(v, 10) || 0);
  return m * 60 + s;
}
