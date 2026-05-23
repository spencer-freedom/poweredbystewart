// Types mirroring scripts/build_ion_demo_assets.py output for
// public/ion/calls-index.json + public/ion/calls/{slug}-*.json.

export type CallSummary = {
  call_id: string;
  rep_id: string | null;
  outcome: string | null;
  duration_min: number;
  demo_role: string | null;
  primary_objection: string | null;
  cherrypick_count: number;
  top_classifications: string[];
  codex_references: string[];
  aging_tier: string;
  is_hero: boolean;
  tagline: string | null;
  is_gray_matter: boolean;
  gray_matter_section: string | null;
  has_handoff: boolean;
};

export type CallsIndex = {
  version: string;
  total_calls: number;
  hero_count: number;
  calls: CallSummary[];
};
