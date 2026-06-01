-- Add `kind` column to ion_schema_notes so the /ion/stewart page can
-- collect TWO independent feedback streams per invariant:
--
--   kind = 'stewart' → rubric feedback ("How should Stewart evaluate
--                      this?"). Judgment / grading model. Stabilizes.
--   kind = 'atlas'   → playbook feedback ("How would you teach this?").
--                      Knowledge / examples / coaching. Compounds.
--
-- Existing rows are tagged 'stewart' by default — they were captured
-- before the split existed, and the page was framed as rubric feedback
-- (Spencer's original brief). Atlas is the new column of growth.

ALTER TABLE ion_schema_notes
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'stewart';

-- Refresh the lookup index to include kind, since hydration now reads
-- "latest per (invariant, reviewer, kind)" rather than "latest per
-- (invariant, reviewer)". Drop-then-create keeps the operation
-- idempotent across re-runs.
DROP INDEX IF EXISTS ix_ion_schema_notes_invariant_reviewer_time;

CREATE INDEX ix_ion_schema_notes_invariant_reviewer_kind_time
  ON ion_schema_notes (invariant, reviewer, kind, written_at DESC);

-- Apply via Supabase SQL editor in the same iacjfguemajtthjzvupj
-- project. Safe to run multiple times.
