import { createClient } from "@supabase/supabase-js";
import { INVARIANTS, LIFT_MATH } from "./schema";
import type { InvariantId } from "./schema";
import type { SubsectionId } from "./NoteBox.client";
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

// Per-(invariant, subsection) hydration. Each invariant has 8
// subsections; each subsection has a stewart + atlas note slot.
export type NotesByKind = { stewart: string; atlas: string };
export type NotesByKindBySubsection = Record<SubsectionId, NotesByKind>;

const SUBSECTIONS: SubsectionId[] = [
  "core_question",
  "job",
  "failure_state",
  "l1",
  "l2",
  "l3",
  "detection",
  "economic_impact",
];

function emptyNotesForInvariant(): NotesByKindBySubsection {
  return SUBSECTIONS.reduce((acc, s) => {
    acc[s] = { stewart: "", atlas: "" };
    return acc;
  }, {} as NotesByKindBySubsection);
}

async function loadInitialNotes(
  reviewer: string
): Promise<Record<InvariantId, NotesByKindBySubsection>> {
  const empty = INVARIANTS.reduce(
    (acc, inv) => {
      acc[inv.id] = emptyNotesForInvariant();
      return acc;
    },
    {} as Record<InvariantId, NotesByKindBySubsection>
  );

  const supabase = serverSupabase();
  if (!supabase) {
    console.warn("[stewart] supabase env missing — rendering empty notes");
    return empty;
  }

  // Pull every row for this reviewer and reduce to the latest content
  // per (invariant, subsection, kind). Pre-column rows come back with
  // legacy defaults ("overall" subsection, "stewart" kind) — those
  // don't map to any of the 8 rendered subsections so they silently
  // drop off the UI, which is the intended migration behavior.
  const { data, error } = await supabase
    .from("ion_schema_notes")
    .select("invariant, subsection, kind, content, written_at")
    .eq("reviewer", reviewer)
    .order("written_at", { ascending: false });

  if (error || !data) {
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
    const sub = (row.subsection as SubsectionId) || "overall";
    const k = (row.kind as "stewart" | "atlas") || "stewart";
    if (
      inv in latest &&
      sub in latest[inv] &&
      !latest[inv][sub as SubsectionId][k]
    ) {
      latest[inv][sub as SubsectionId][k] = row.content as string;
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
          <div className="text-sm text-stewart-text leading-relaxed space-y-2">
            <p>This is the new schema structure.</p>
            <p>
              Each section answers a different question and ties to a
              specific revenue lever.
            </p>
            <p>
              Type whatever rings true, what&apos;s wrong, what you&apos;d
              add &mdash; autosaved.
            </p>
            <p>Spencer will fold your notes back in after.</p>
          </div>
          <p className="mt-3 text-xs text-stewart-muted leading-relaxed">
            {LIFT_MATH}
          </p>
        </div>
      </header>

      <Anatomy />

      <TableOfContents />

      <StewartSchemaPage reviewer={reviewer} initialNotes={initialNotes} />

      <footer className="pt-8 border-t border-stewart-border text-xs text-stewart-muted leading-relaxed">
        Saving as <span className="font-mono text-stewart-text">{reviewer}</span>.
        Every keystroke autosaves a few seconds after you stop typing.
        Full edit history preserved — Spencer queries the table directly.
      </footer>
    </div>
  );
}

// Anatomy legend — explains the seven subsections that every
// invariant follows, in operator-language. Kenny shouldn't need
// Spencer to explain what each label means before he can dig in.
function Anatomy() {
  const rows: Array<{ label: string; body: string }> = [
    {
      label: "Core Question",
      body: "The one thing the section answers.",
    },
    {
      label: "Job",
      body: "What this stage of the call must accomplish.",
    },
    {
      label: "Failure state",
      body: "What goes wrong when the job isn't done.",
    },
    {
      label: "Maturity ladder",
      body: "Three levels of execution. L1 — mechanical (rep follows the script). L2 — adaptive (rep reads the customer and adjusts). L3 — advanced salesmanship (rep is inside the customer's head).",
    },
    {
      label: "Detection signals",
      body: "What Stewart looks for in the transcript to score the call. Collapsed by default — engineer view; skip if you don't need it.",
    },
    {
      label: "Economic Impact",
      body: "What improving this section should move on the business — KPI + dollar-grounded hypothesis.",
    },
    {
      label: "Stewart feedback",
      body: "How should Stewart evaluate this? Rubric-level — is L1/L2/L3 right, what should Stewart detect, does this belong here or in a different invariant. Judgment stabilizes over time.",
    },
    {
      label: "Atlas feedback",
      body: "How would you teach this? Playbook-level — word tracks, stories, best practices, exceptions, “my best rep does this by…” Knowledge compounds.",
    },
    {
      label: "Where they appear",
      body: "A Stewart + Atlas feedback pair sits after every subsection (Core Question, Job, Failure state, each L level, Detection, Economic Impact). Leave a note wherever a thought lands — it attaches to that block, not the whole invariant.",
    },
  ];
  return (
    <section className="rounded-lg border border-stewart-border bg-stewart-card p-5 sm:p-6">
      <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
        How each section is laid out
      </p>
      <dl className="space-y-2.5">
        {rows.map(({ label, body }) => (
          <div
            key={label}
            className="sm:grid sm:grid-cols-[10rem_1fr] sm:gap-4"
          >
            <dt className="text-sm font-semibold text-stewart-text">
              {label}
            </dt>
            <dd className="text-sm text-stewart-muted leading-relaxed">
              {body}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// Table of contents — six invariants by number + name + the Core
// Question that section answers. Gives Kenny the full arc in one
// scan before he starts deep-reading. Names link to the section
// anchor so a tap jumps straight there.
function TableOfContents() {
  return (
    <section>
      <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
        The six invariants
      </p>
      <ol className="space-y-2.5">
        {INVARIANTS.map((inv) => (
          <li
            key={inv.id}
            className="rounded border border-stewart-border bg-stewart-bg/40 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-baseline sm:gap-4"
          >
            <span className="font-mono text-xs text-stewart-muted sm:w-16 shrink-0">
              Invariant {inv.number}
            </span>
            <span className="font-semibold text-stewart-text sm:w-32 shrink-0">
              {inv.title}
            </span>
            <span className="text-sm text-stewart-muted italic leading-snug">
              {inv.core_question}
            </span>
          </li>
        ))}
      </ol>
    </section>
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
