// Mirror of scripts/build_ion_demo_assets.py codex-payload.json shape.

export type CodexStatus = "resolved" | "tbd" | "lit" | "stub";

export type CodexCorpusStats = {
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

export type CodexSection = {
  path: string;
  domain: string;
  leaf: string;
  status: CodexStatus;
  resolved_at: string | null;
  tbd_items: string[];
  corpus_stats: CodexCorpusStats;
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

export type CodexPayload = {
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
  sections: CodexSection[];
  proposed_categories: ProposedCategory[];
  domain_order: string[];
};
