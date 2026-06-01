import { NextRequest, NextResponse } from "next/server";

// Telegram-notify seam for /ion/stewart autosaves. The client's
// NoteBox fires this route immediately after a successful Supabase
// write (fire-and-forget — failure here never blocks the save).
//
// V1: stub returns 204. The page ships without ever pinging Spencer
// while we wire the real Telegram glue.
//
// Follow-up commit (per the plan + brief patch):
//   - Direct Telegram Bot API call (not REST-to-SpencerOS) using
//     TELEGRAM_BOT_TOKEN + TELEGRAM_SPENCER_CHAT_ID env vars. Keeps
//     this customer-facing artifact self-contained — no dependency
//     on SpencerOS backend uptime.
//   - One ping per (invariant, reviewer) per America/Denver calendar
//     day. Guard: query ion_schema_notes for prior rows matching the
//     same day; skip if found, send if not. Bounded at 6 pings/day max.
//   - Message format: `Kenny started notes on [Invariant Name].
//     First line: "[first 200 chars]..."` — content lifted from the
//     FIRST row of the day, not the latest.
//
// Route shape stays stable across V1 → follow-up; only the body fills
// in. Client never needs to change.

export const runtime = "nodejs";

type NotifyBody = {
  invariant?: string;
  reviewer?: string;
  // 'stewart' = rubric feedback box, 'atlas' = playbook feedback box.
  kind?: string;
  // Which subsection of the invariant the note attaches to (core_question,
  // job, failure_state, l1, l2, l3, detection, economic_impact). The
  // follow-up Telegram body uses this to describe what Kenny is reacting
  // to in the ping ("...on Anchor → Failure State").
  subsection?: string;
};

export async function POST(req: NextRequest) {
  let body: NotifyBody = {};
  try {
    body = (await req.json()) as NotifyBody;
  } catch {
    // Empty / malformed body — still 204. Client doesn't care; this
    // is fire-and-forget for telemetry, not a save channel.
  }

  // Visibility only: in production this lands in Vercel function logs.
  // Useful to confirm the route fires while the body is still a stub.
  if (body.invariant && body.reviewer) {
    console.log(
      `[stewart-notify] stub fired · invariant=${body.invariant} subsection=${body.subsection || "overall"} kind=${body.kind || "stewart"} reviewer=${body.reviewer}`
    );
  }

  return new NextResponse(null, { status: 204 });
}
