// Mirror of scripts/build_ion_demo_assets.py schema-payload.json shape.

export type SchemaStatus = "resolved" | "tbd" | "lit" | "stub";

// V1 card-grid taxonomy. The payload's raw status is what the build
// script emits; the card grid groups them into 4 visual states.
// Mapping (see effectiveCardStatus below):
//   - "lit" or ("resolved" with any corpus signal) → "lit"
//   - "tbd"                                          → "tbd"
//   - "stub"                                         → "scaffolded"
// PROPOSED entries don't live in `sections[]` — they come from
// `proposed_categories[]` and render through a separate <ProposedCard/>.
export type CardStatus = "lit" | "tbd" | "scaffolded";

// Hero override (Track 2 — Strategy Claude drops in
// public/ion/schema-hero-overrides.json). Renderer reads the file at
// page load and swaps these fields into the auto-template card when
// the section path has an entry. Missing file = empty {} = no swaps.
//
// A minimal override of just { bombshell: true } lights the ribbon
// on an otherwise auto-template card.
export type HeroOverride = {
  headline?: string;
  what_this_is?: string;
  why_it_matters?: string;
  what_good_sounds_like?: {
    quote: string;
    attribution: string;
  };
  coaching_focus?: string;
  bombshell?: boolean;
};

export type HeroOverridesFile = Record<string /* section path */, HeroOverride>;

export type SchemaCorpusStats = {
  call_count?: number;
  classifications?: Record<string, number>;
  outcomes?: Record<string, number>;
  recent_examples?: Array<{
    call_id: string;
    ts: string;
    quote: string;
    classification: string;
  }>;
  gray_matter_exemplars?: Array<{
    call_id: string;
    exemplifies: string;
    reason?: string;
  }>;
};

export type SchemaSection = {
  path: string;
  domain: string;
  leaf: string;
  status: SchemaStatus;
  resolved_at: string | null;
  tbd_items: string[];
  corpus_stats: SchemaCorpusStats;
  raw_yaml: string;
};

export type ProposedCategory = {
  name: string;
  description: string;
  distinct_from?: string;
  distinction?: string;
  fix?: string;
  coaching_drill?: string;
  coaching_priority?: string | null;
  critical_finding?: string;
  attribution?: string;
  example_call_ids?: Array<{ call_id: string; ts?: string } | string>;
  sample_frequency_in_corpus?: number;
  detected_in_corpus_actually_executed?: number | null;
  corpus_data_2026_05_22?: Record<string, unknown> | null;
  is_bombshell?: boolean;
  spencers_catch?: boolean;
};

// Maps the payload's raw SchemaStatus onto the card-grid CardStatus.
// "resolved" with corpus data reads as LIT (the resolution put the
// section to work). "resolved" with no corpus data still reads as
// LIT — the entry exists and the topic is settled.
// "stub" sections are scaffolded YAML lines that aren't lit yet —
// the embedded build converts these into LIT over time.
export function effectiveCardStatus(section: SchemaSection): CardStatus {
  if (section.status === "tbd") return "tbd";
  if (section.status === "stub") return "scaffolded";
  return "lit";
}

// Count "booked" outcomes from a section's corpus_stats. Skips the
// "null" bucket the analysis layer uses for un-tagged outcomes.
export function bookedCount(stats: SchemaCorpusStats | undefined): number {
  if (!stats?.outcomes) return 0;
  let n = 0;
  for (const [k, v] of Object.entries(stats.outcomes)) {
    if (k === "null" || k === "unknown") continue;
    if (
      k === "booked" ||
      k === "appointment_set" ||
      k === "transferred_to_closer" ||
      k === "tentative_appointment_booked"
    ) {
      n += v;
    }
  }
  return n;
}

// Best-effort parse of the `description:` field out of a section's
// raw_yaml. Handles both inline (description: foo) and block-scalar
// (description: | \n  foo bar) forms. Returns null if not found.
//
// V1 cost: brittle to formatting drift. Future: expose description as
// a structured field on SchemaSection from scripts/build_ion_demo_assets.py
// so the frontend doesn't re-parse YAML. See the TODO at the
// SchemaSection serialization site in that script.
export function descriptionFromYaml(rawYaml: string | undefined): string | null {
  if (!rawYaml) return null;
  // Inline form: `description: some text`
  const inline = rawYaml.match(/^\s*description:\s+(?!\|)(.+?)$/m);
  if (inline) {
    const v = inline[1].trim().replace(/^["']|["']$/g, "");
    if (v) return v;
  }
  // Block form: `description: |` followed by indented lines.
  const block = rawYaml.match(/^(\s*)description:\s*\|\s*\n((?:\1\s+.*(?:\n|$))+)/m);
  if (block) {
    const indent = block[1];
    const lines = block[2]
      .split("\n")
      .map((l) => l.replace(new RegExp(`^${indent}\\s+`), ""))
      .filter((l) => l.length > 0);
    if (lines.length) return lines.join(" ").trim();
  }
  return null;
}

export type SchemaPayload = {
  version: string;
  total_lines: number;
  stats: {
    total_lines: number;
    sections_lit: number;
    tbds: number;
    resolved: number;
    presumptive_gray_matter: number;
    proposed_pending: number;
  };
  sections: SchemaSection[];
  proposed_categories: ProposedCategory[];
  domain_order: string[];
};
