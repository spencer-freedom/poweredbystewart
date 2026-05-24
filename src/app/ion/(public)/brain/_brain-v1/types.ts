// V1 brain renderer types. Built from the raw 101 codex-section JSONs
// at data/ion_solar/brain/nodes/*.json, flattened into a single payload
// the client can render without further I/O.

export type Outcome = "booked" | "no_interest" | "callback" | "declined" | "unknown" | string;

// Top-tier codex_section domain prefixes, used for vertical tier placement.
export const DOMAIN_TIERS: { tier: number; y: number; domains: string[]; label: string }[] = [
  {
    tier: 0,
    y: 120,
    label: "Call opening",
    domains: ["intros", "context"],
  },
  {
    tier: 1,
    y: 60,
    label: "Qualification",
    domains: ["verify", "qualifiers", "dq_rules", "llm_context_injection"],
  },
  {
    tier: 2,
    y: 0,
    label: "Call shape · protocols",
    domains: [
      "call_shape",
      "protocols",
      "ion_offerings_beyond_setter_call",
    ],
  },
  {
    tier: 3,
    y: -60,
    label: "Coaching · rebuttals",
    domains: [
      "rebuttals",
      "coaching_philosophy",
      "bill_collection",
      "handoff_brief_discipline",
      "setter_compensation_model",
    ],
  },
  {
    tier: 4,
    y: -120,
    label: "Cross-sell · outcomes · analysis",
    domains: [
      "cross_sell_signals",
      "outcomes",
      "analysis_directives",
      "button_up",
      "text_after_call",
      "orphaned_flow",
    ],
  },
];

export type RawBrainNodeJson = {
  codex_section: string;
  call_ids: string[];
  pattern_counts_by_classification: Record<string, number>;
  recent_examples: Array<{
    call_id: string;
    ts: string;
    quote: string;
    classification: string;
  }>;
  outcomes: Record<string, number>;
  gray_matter_exemplars: Array<{
    call_id: string;
    exemplifies: string;
    rep_id?: string;
    ts?: string;
    why?: string;
  }>;
  last_updated_at: string;
};

export type CoreNode = {
  id: string; // "core:protocols.spouse_decision"
  kind: "core";
  codex_section: string;
  tier: number; // 0..4
  tier_label: string;
  call_count: number;
  cherry_pick_count: number;
  classifications: Record<string, number>;
  outcomes: Record<string, number>;
  x: number;
  y: number;
  z: number;
};

export type SoftSatellite = {
  id: string; // "soft:<call_id>:<ts>"
  kind: "soft";
  parent_id: string; // core id
  parent_codex_section: string;
  call_id: string;
  ts: string;
  quote: string;
  classification: string;
  outcome: Outcome;
  x: number;
  y: number;
  z: number;
};

export type GraySatellite = {
  id: string;
  kind: "gray";
  parent_id: string;
  parent_codex_section: string;
  call_id: string;
  rep_id?: string;
  ts?: string;
  why?: string;
  x: number;
  y: number;
  z: number;
};

export type BrainV1Node = CoreNode | SoftSatellite | GraySatellite;

export type BrainV1Payload = {
  cores: CoreNode[];
  softs: SoftSatellite[];
  grays: GraySatellite[];
  stats: {
    total_calls: number;
    total_sections: number;
    total_cherry_picks: number;
    gray_matter_count: number;
  };
  tiers: { tier: number; y: number; label: string; domains: string[] }[];
};

export function domainFor(codexSection: string): string {
  return codexSection.split(".")[0] || codexSection;
}

export function tierFor(codexSection: string): { tier: number; y: number; label: string } {
  const domain = domainFor(codexSection);
  for (const t of DOMAIN_TIERS) {
    if (t.domains.includes(domain)) return { tier: t.tier, y: t.y, label: t.label };
  }
  // Fallback: center tier for unknown domains.
  return { tier: 2, y: 0, label: "Center" };
}

// djb2-style deterministic hash → angle on a disc (0..2π).
export function hashAngle(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  // Map signed int → [0, 2π)
  const norm = ((h % 360) + 360) % 360;
  return (norm / 360) * Math.PI * 2;
}

// Outcome → color (Tailwind palette mirrored as hex for Three.js).
export const OUTCOME_COLOR: Record<string, string> = {
  booked: "#22c55e",
  tentative_appointment: "#22c55e",
  transferred_to_closer: "#22c55e",
  no_interest: "#ef4444",
  declined: "#ef4444",
  unqualified: "#ef4444",
  callback: "#3b82f6",
  conditional_booking: "#3b82f6",
  engaged_noset: "#f59e0b",
  unknown: "#94a3b8",
  null: "#94a3b8",
};

export function outcomeColor(outcome: string | null | undefined): string {
  if (!outcome) return OUTCOME_COLOR.unknown;
  return OUTCOME_COLOR[outcome] || OUTCOME_COLOR.unknown;
}
