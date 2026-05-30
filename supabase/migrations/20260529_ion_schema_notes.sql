-- Append-only notes captured by the /ion/stewart review page.
-- Each save = one new row (full edit history preserved). Spencer queries
-- this table directly to absorb Kenny's feedback; the page itself only
-- ever reads the latest row per (invariant, reviewer) for hydration.
--
-- RLS is permissive on insert AND select for the anon role. The page is
-- a public URL with no auth gate; defense-in-depth lives at the
-- application-layer reviewer query, not at the DB. Spencer accepted
-- this trade-off explicitly — V1 is a data-capture surface, not a
-- collaboration layer.
--
-- Apply this migration via the Supabase SQL editor (or `supabase db
-- push` if using the CLI). No supabase/migrations/ directory existed
-- in this repo before — future migrations should land here.

CREATE TABLE ion_schema_notes (
  id          BIGSERIAL PRIMARY KEY,
  invariant   TEXT NOT NULL,
  reviewer    TEXT NOT NULL DEFAULT 'anonymous',
  content     TEXT NOT NULL,
  written_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_ion_schema_notes_invariant_reviewer_time
  ON ion_schema_notes (invariant, reviewer, written_at DESC);

ALTER TABLE ion_schema_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY ion_schema_notes_insert ON ion_schema_notes
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY ion_schema_notes_select ON ion_schema_notes
  FOR SELECT TO anon USING (true);
