-- Add `subsection` column to ion_schema_notes so feedback can attach
-- to the specific subsection a reviewer is reading — not just the
-- invariant as a whole. Eight allowed subsections per invariant:
--   core_question, job, failure_state, l1, l2, l3, detection,
--   economic_impact
--
-- Combined with `kind` (stewart | atlas), each invariant now has 16
-- distinct feedback slots per reviewer. Granularity matches the
-- review surface: Kenny reads Core Question, his reaction lands at
-- Core Question. Reads L2, reaction lands at L2.
--
-- Existing rows default to 'overall' — they pre-date the per-
-- subsection split and were captured as bottom-of-section feedback.
-- The page no longer reads 'overall' anywhere, so those rows stay
-- queryable for archaeology but don't surface in the UI.

ALTER TABLE ion_schema_notes
  ADD COLUMN IF NOT EXISTS subsection TEXT NOT NULL DEFAULT 'overall';

-- Refresh the lookup index to include subsection. Hydration now reads
-- "latest per (invariant, subsection, reviewer, kind)" — 4 dimensions.
DROP INDEX IF EXISTS ix_ion_schema_notes_invariant_reviewer_kind_time;

CREATE INDEX ix_ion_schema_notes_lookup
  ON ion_schema_notes (invariant, subsection, reviewer, kind, written_at DESC);

-- Same iacjfguemajtthjzvupj project. Safe to re-run.
