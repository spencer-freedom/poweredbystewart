import { createClient } from "@supabase/supabase-js";
import { INVARIANTS, LIFT_MATH } from "./schema";
import type { InvariantId } from "./schema";
import { StewartSchemaPage } from "./StewartSchemaPage.client";

// Server-side Supabase client. We build it inline (instead of using
// src/lib/supabase) because that module reads NEXT_PUBLIC_SUPABASE_URL
// at import time and throws if it's empty — and Spencer's env uses
// the server-only SUPABASE_URL + SUPABASE_SERVICE_KEY pair. Same
// fallback pattern as the audio-clip route.
function serverSupabase() {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export const dynamic = "force-dynamic";

// Public Kenny-review surface for the locked Ion Setter Schema. URL
// pattern: /ion/stewart?reviewer=<slug> — anonymous if missing.
// All six invariants render with their initial notes hydrated
// server-side so there's no fetch waterfall on load. NoteBox takes
// over from there — debounced autosave, no save button, no auth.

type PageProps = {
  searchParams: Promise<{ reviewer?: string }>;
};

async function loadInitialNotes(
  reviewer: string
): Promise<Record<InvariantId, string>> {
  const empty = INVARIANTS.reduce(
    (acc, inv) => {
      acc[inv.id] = "";
      return acc;
    },
    {} as Record<InvariantId, string>
  );

  const supabase = serverSupabase();
  if (!supabase) {
    console.warn("[stewart] supabase env missing — rendering empty notes");
    return empty;
  }

  // Pull every row for this reviewer and reduce to the latest content
  // per invariant. We can't use Postgres `DISTINCT ON` through the
  // supabase-js builder, so we dedupe in memory. Volume is small
  // (6 invariants × 1 user × autosave-per-paragraph cadence) so the
  // cost is negligible.
  const { data, error } = await supabase
    .from("ion_schema_notes")
    .select("invariant, content, written_at")
    .eq("reviewer", reviewer)
    .order("written_at", { ascending: false });

  if (error || !data) {
    // Missing migration / RLS error / network blip → empty state.
    // Render the page anyway; user can still leave notes (those
    // saves will surface a clearer error in the NoteBox status line).
    if (error) {
      console.warn(
        "[stewart] loadInitialNotes error — rendering empty:",
        error.message
      );
    }
    return empty;
  }

  const latest = { ...empty };
  for (const row of data) {
    const inv = row.invariant as InvariantId;
    if (inv in latest && !latest[inv]) {
      latest[inv] = row.content as string;
    }
  }
  return latest;
}

export default async function IonStewartReviewPage({
  searchParams,
}: PageProps) {
  const { reviewer: rawReviewer } = await searchParams;
  const reviewer = normalizeReviewer(rawReviewer);
  const initialNotes = await loadInitialNotes(reviewer);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent">
          Stewart × Ion Solar
        </p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stewart-text leading-tight">
          The Ion Solar Setter Schema
        </h1>
        <p className="text-base text-stewart-muted">
          Spencer&apos;s working draft &mdash; {capitalize(reviewer)}
          &apos;s notes welcome.
        </p>
        <div className="rounded-lg border border-stewart-border bg-stewart-card p-4 sm:p-5 mt-4">
          <p className="text-sm text-stewart-text leading-relaxed">
            This is the new schema structure. Each section answers a
            different question and ties to a specific revenue lever.
            Type whatever rings true, what&apos;s wrong, what you&apos;d
            add &mdash; autosaved. Spencer will fold your notes back in
            after.
          </p>
          <p className="mt-3 text-xs text-stewart-muted leading-relaxed">
            {LIFT_MATH}
          </p>
        </div>
      </header>

      <StewartSchemaPage reviewer={reviewer} initialNotes={initialNotes} />

      <footer className="pt-8 border-t border-stewart-border text-xs text-stewart-muted leading-relaxed">
        Saving as <span className="font-mono text-stewart-text">{reviewer}</span>.
        Every keystroke autosaves a few seconds after you stop typing.
        Full edit history preserved — Spencer queries the table directly.
      </footer>
    </div>
  );
}

function normalizeReviewer(raw: string | undefined): string {
  if (!raw) return "anonymous";
  const trimmed = raw.trim().toLowerCase();
  // Conservative slug — letters, digits, dash, underscore. Anything
  // else gets dropped so we don't write weird strings into Supabase.
  const sanitized = trimmed.replace(/[^a-z0-9_-]/g, "");
  return sanitized || "anonymous";
}

function capitalize(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}
