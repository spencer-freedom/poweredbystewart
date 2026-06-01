import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side write surface for the /ion/stewart autosave. The client
// NoteBox POSTs here instead of going straight to Supabase — keeps
// the service key out of the browser bundle and survives the case
// where NEXT_PUBLIC_SUPABASE_URL isn't set (the audio-clip route
// pattern: SUPABASE_URL || NEXT_PUBLIC_SUPABASE_URL).
//
// Each successful insert returns 201 with the persisted row's id +
// written_at so the client can stamp the "last saved" indicator
// against the server's clock, not the browser's.

export const runtime = "nodejs";

type SaveBody = {
  invariant?: string;
  reviewer?: string;
  content?: string;
  kind?: string;
  subsection?: string;
};

// Tight allowlist — anything else is a schema mismatch or bad client
// state, not a typo. Mirror the InvariantId union in schema.ts.
const VALID_INVARIANTS = new Set([
  "intro",
  "anchor",
  "match",
  "reframe",
  "qualifier",
  "button_up",
]);

// Per the two-box split:
//   stewart = rubric feedback (judgment / grading)
//   atlas   = playbook feedback (knowledge / examples)
// Missing kind defaults to "stewart" — preserves back-compat with any
// older client still POSTing without the field.
const VALID_KINDS = new Set(["stewart", "atlas"]);

// Feedback attaches to the subsection a reviewer is reading. Eight
// subsections per invariant, matching the rendered structure:
//   core_question, job, failure_state, l1, l2, l3, detection,
//   economic_impact
// Missing subsection defaults to "overall" — same back-compat note
// as above (older clients posting without the field).
const VALID_SUBSECTIONS = new Set([
  "core_question",
  "job",
  "failure_state",
  "l1",
  "l2",
  "l3",
  "detection",
  "economic_impact",
  "overall",
]);

const MAX_CONTENT_BYTES = 100_000; // sanity cap — Kenny's longest note imaginable

export async function POST(req: NextRequest) {
  let body: SaveBody;
  try {
    body = (await req.json()) as SaveBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const invariant = (body.invariant || "").trim();
  const reviewer = sanitizeReviewer(body.reviewer);
  const content = typeof body.content === "string" ? body.content : "";
  const kind = (body.kind || "stewart").trim().toLowerCase();
  const subsection = (body.subsection || "overall").trim().toLowerCase();

  if (!VALID_INVARIANTS.has(invariant)) {
    return NextResponse.json(
      { error: "invalid invariant", got: invariant },
      { status: 400 }
    );
  }
  if (!VALID_KINDS.has(kind)) {
    return NextResponse.json(
      { error: "invalid kind", got: kind },
      { status: 400 }
    );
  }
  if (!VALID_SUBSECTIONS.has(subsection)) {
    return NextResponse.json(
      { error: "invalid subsection", got: subsection },
      { status: 400 }
    );
  }
  if (Buffer.byteLength(content, "utf-8") > MAX_CONTENT_BYTES) {
    return NextResponse.json(
      { error: "content too large" },
      { status: 413 }
    );
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "supabase env not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("ion_schema_notes")
    .insert({ invariant, reviewer, content, kind, subsection })
    .select("id, written_at")
    .single();

  if (error) {
    // Most common cause: migration not yet applied. Surface the code
    // so the client can show a readable status without leaking the
    // raw Postgres message.
    return NextResponse.json(
      {
        error: "supabase insert failed",
        code: error.code,
        message: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { id: data.id, written_at: data.written_at },
    { status: 201 }
  );
}

function sanitizeReviewer(raw: string | undefined): string {
  if (!raw) return "anonymous";
  const trimmed = raw.trim().toLowerCase();
  const sanitized = trimmed.replace(/[^a-z0-9_-]/g, "");
  return sanitized || "anonymous";
}
