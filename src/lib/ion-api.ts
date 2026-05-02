// Ion Solar / SalesOS prospect-dashboard API client.
// Auth = signed token in URL path; we forward it as ?token=<token>.
// Backend lives in SpencerOS (FastAPI on Railway). Cross-origin via CORS allow-list.
// Canonical contract: SpencerOS/data/ion_calls/POWEREDBYSTEWART_INTEGRATION.md

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://spenceros-production.up.railway.app";

export const ION_API_BASE = BASE_URL;

// ─── Types matching the /api/ion/decision-tree response shape ────────────────

export type LosingPattern = {
  cluster_id: string;
  source_call_id: string;
  verbatim: string;
  what_went_wrong: string;
};

export type Cluster = {
  id: string;
  name: string;
  description: string;
  frequency: number;
  win_rate: number;
  outcome_breakdown?: Record<string, number>;
};

export type AudioExample = {
  call_id: string;
  start_seconds: number | null;
  end_seconds: number | null;
  outcome: string;
  attempt_n: number | null;
  outcome_observed: string | null;
};

export type WordTrack = {
  id: string;
  cluster_id: string;
  rank: number;
  verbatim: string;
  source_call_id: string;
  source_setter_id: string | null;
  win_rate: number;
  sample_size: number;
  why_it_works: string;
  start_seconds: number | null;
  end_seconds: number | null;
  audio_examples?: AudioExample[];
};

export type Transition = {
  parent_track_id: string;
  condition: "worked" | "partial" | "failed";
  next_track_id: string | null;
  transition_rate: number | null;
  sample_size: number;
  note: string;
};

export type PipelineStats = {
  tenant_id: string;
  cohort: string;
  generated_at: string;
  n_received: number;
  n_transcribed: number;
  n_real_sales: number;
  n_wins: number;
  n_engaged_noset: number;
  n_hard_losses: number;
  gate_reasons?: Record<string, number>;
};

export type DecisionTreePayload = {
  tenant_id: string;
  kind: string;
  expires_at: number;
  generated_at: string | null;
  cohort: string | null;
  model: string | null;
  macro_win_rate?: number;
  pipeline_stats: PipelineStats;
  pipeline_cost_usd: number;
  executive_summary: string;
  noise_disclaimer: string;
  kenny_data_ask: string;
  clusters: Cluster[];
  word_tracks: WordTrack[];
  transitions: Transition[];
  losing_patterns: LosingPattern[];
};

export type UploadStatus = {
  tenant_id: string;
  totals: { uploaded: number; transcribed: number; analyzed: number };
  by_cohort: Array<{
    cohort: string;
    uploaded: number;
    transcribed: number;
    analyzed: number;
  }>;
};

// ─── Cohort UI ↔ API mapping ────────────────────────────────────────────────

export const COHORT_MAP = {
  wins: "kenny_filtered_wins",
  engaged_losses: "kenny_filtered_engaged_losses",
} as const;
export type CohortLabel = keyof typeof COHORT_MAP;

// ─── Fetchers ────────────────────────────────────────────────────────────────

export async function fetchDecisionTree(token: string): Promise<DecisionTreePayload> {
  const res = await fetch(
    `${BASE_URL}/api/ion/decision-tree?token=${encodeURIComponent(token)}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`decision-tree ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

export async function fetchUploadStatus(token: string): Promise<UploadStatus> {
  const res = await fetch(
    `${BASE_URL}/api/ion/upload-status?token=${encodeURIComponent(token)}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`upload-status ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// Audio clip URL builder. Backend takes seconds (floats) as query params.
export function audioClipUrl(
  token: string,
  callId: string,
  startSec: number,
  endSec: number
): string {
  const start = Math.max(0, startSec);
  const end = Math.max(start + 0.1, endSec);
  const qs = new URLSearchParams({
    start: start.toFixed(3),
    end: end.toFixed(3),
    token,
  });
  return `${BASE_URL}/api/ion/audio-clip/${encodeURIComponent(callId)}?${qs.toString()}`;
}

// ─── Upload (one file) ───────────────────────────────────────────────────────

export type UploadResult =
  | {
      status: "uploaded";
      call_id: string;
      filename: string;
      audio_sha256: string;
      bytes: number;
      cohort: string;
      transcription_state: string;
    }
  | {
      status: "duplicate";
      call_id: string;
      filename: string;
      audio_sha256: string;
      bytes: number;
    };

// Many call-recording exports (Five9, Genesys, etc.) write every call into
// a per-call folder with an identical filename like SESSION.MP3. The backend
// derives call_id from the basename, so identical filenames collide on
// INSERT (ON CONFLICT (id) DO NOTHING) and silently drop ~half the batch
// under concurrency. Rename the upload to a unique stem here:
//   - if the file came in via folder drop with relative-path info, use the
//     parent directory name (the actual call_id from Five9 / similar)
//   - otherwise, append a short random suffix to guarantee uniqueness
function uniqueUploadName(file: File): string {
  const path =
    (file as { path?: string }).path ||
    (file as { webkitRelativePath?: string }).webkitRelativePath ||
    "";
  const parts = path.split(/[/\\]/).filter(Boolean);
  const ext = (file.name.split(".").pop() || "mp3").toLowerCase();
  if (parts.length >= 2) {
    const callIdGuess = parts[parts.length - 2];
    if (/^[A-Za-z0-9_-]{3,}$/.test(callIdGuess)) {
      return `${callIdGuess}.${ext}`;
    }
  }
  const stem = file.name.replace(/\.[^.]+$/, "") || "upload";
  const suffix = Math.random().toString(36).slice(2, 10);
  return `${stem}_${suffix}.${ext}`;
}

export async function uploadCall(
  token: string,
  file: File,
  cohortLabel: CohortLabel,
  metadata: Record<string, unknown> = {}
): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file, uniqueUploadName(file));
  form.append("cohort", COHORT_MAP[cohortLabel]);
  form.append("metadata_json", JSON.stringify(metadata));

  const res = await fetch(`${BASE_URL}/api/ion/upload?token=${encodeURIComponent(token)}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`upload ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}
