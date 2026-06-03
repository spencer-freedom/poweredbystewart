import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Telegram-notify for /ion/stewart autosaves. The client's NoteBox
// fires this route AFTER a successful Supabase write (fire-and-forget
// — failures here never block the save). Self-contained: direct
// Bot API call, no dependency on SpencerOS backend uptime.
//
// Ping rate-limit:
//   One ping per (invariant, reviewer) per America/Denver calendar day.
//   First save of the day for a given invariant triggers a ping; every
//   subsequent save against the same invariant that day is silent.
//   Ceiling = 6 pings/day per reviewer (one per invariant).
//
// Message format:
//   {Reviewer} started notes on {Invariant} → {Subsection} ({Kind}).
//   "{first 200 chars of the first row of the day}"
//
// Env required:
//   TELEGRAM_BOT_TOKEN          — the bot's API token
//   TELEGRAM_SPENCER_CHAT_ID    — Spencer's Telegram chat ID
//   SUPABASE_URL + SUPABASE_SERVICE_KEY  — same fallback chain as
//                                          the save + audio-clip routes
//
// The route always returns 204 (or 200) — client never knows or
// cares whether a ping fired. Telegram and Supabase failures get
// logged for Vercel function diagnostics.

export const runtime = "nodejs";

type NotifyBody = {
  invariant?: string;
  reviewer?: string;
  kind?: string;
  subsection?: string;
};

// Display labels used in the Telegram message.
const INVARIANT_LABEL: Record<string, string> = {
  intro: "Intro",
  anchor: "Anchor",
  match: "Match",
  reframe: "Reframe",
  qualifier: "Qualified",
  button_up: "Button-Up",
};

const SUBSECTION_LABEL: Record<string, string> = {
  core_question: "Core Question",
  job: "Job",
  failure_state: "Failure State",
  l1: "L1 (Mechanical)",
  l2: "L2 (Adaptive)",
  l3: "L3 (Advanced)",
  detection: "Detection",
  economic_impact: "Economic Impact",
  overall: "overall",
};

const KIND_LABEL: Record<string, string> = {
  stewart: "Stewart · rubric",
  atlas: "Atlas · playbook",
};

export async function POST(req: NextRequest) {
  let body: NotifyBody = {};
  try {
    body = (await req.json()) as NotifyBody;
  } catch {
    // Malformed body — still 204. Telemetry only.
    return new NextResponse(null, { status: 204 });
  }

  const invariant = (body.invariant || "").trim();
  const reviewer = (body.reviewer || "").trim().toLowerCase();
  const subsection = (body.subsection || "overall").trim();
  const kind = (body.kind || "stewart").trim();

  if (!invariant || !reviewer || !INVARIANT_LABEL[invariant]) {
    return new NextResponse(null, { status: 204 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_SPENCER_CHAT_ID;
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!botToken || !chatId) {
    // Env not configured — log once for visibility, no-op the ping.
    // Same behavior as the original stub; the page UX is unaffected.
    console.warn(
      "[stewart-notify] TELEGRAM_BOT_TOKEN or TELEGRAM_SPENCER_CHAT_ID missing — skipping ping"
    );
    return new NextResponse(null, { status: 204 });
  }
  if (!supabaseUrl || !serviceKey) {
    console.warn("[stewart-notify] supabase env missing — skipping ping");
    return new NextResponse(null, { status: 204 });
  }

  // First-save-of-day guard. Query for all rows from this reviewer on
  // this invariant since today's Denver midnight, ascending by time.
  // - 0 rows → race (save in flight); skip silently
  // - 1 row  → we are the first of the day; send the ping using this
  //            row's content
  // - 2+ rows → not the first; silent
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
  const dayStart = denverDayStartUtcIso(new Date());
  const { data, error } = await supabase
    .from("ion_schema_notes")
    .select("content, subsection, kind, written_at")
    .eq("invariant", invariant)
    .eq("reviewer", reviewer)
    .gte("written_at", dayStart)
    .order("written_at", { ascending: true })
    .limit(2);

  if (error) {
    console.warn("[stewart-notify] supabase query failed:", error.message);
    return new NextResponse(null, { status: 204 });
  }
  if (!data || data.length !== 1) {
    // 0 rows → race; 2+ rows → already pinged today. Either way, skip.
    return new NextResponse(null, { status: 204 });
  }

  // First save of the day for this (invariant, reviewer). Build the
  // ping copy from the row we just inserted — preserves Spencer's
  // requested "first line of the day" semantics.
  const firstRow = data[0];
  const firstContent = (firstRow.content as string) || "";
  const firstSub = (firstRow.subsection as string) || subsection;
  const firstKind = (firstRow.kind as string) || kind;

  const reviewerLabel =
    reviewer.charAt(0).toUpperCase() + reviewer.slice(1);
  const invariantLabel = INVARIANT_LABEL[invariant];
  const subsectionLabel = SUBSECTION_LABEL[firstSub] || firstSub;
  const kindLabel = KIND_LABEL[firstKind] || firstKind;

  const snippet =
    firstContent.length > 200
      ? firstContent.slice(0, 200).trimEnd() + "…"
      : firstContent;

  const text =
    `${reviewerLabel} started notes on ${invariantLabel} → ` +
    `${subsectionLabel} (${kindLabel}).\n` +
    `"${snippet}"`;

  // Plain-text message — no parse_mode, so we don't have to escape
  // markdown characters in Kenny's freeform content. Telegram chat
  // shows newlines fine without any formatting marker.
  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
      }
    );
    if (!tgRes.ok) {
      const errBody = await tgRes.text();
      console.warn(
        `[stewart-notify] Telegram send failed (${tgRes.status}):`,
        errBody.slice(0, 300)
      );
    }
  } catch (e) {
    console.warn("[stewart-notify] Telegram fetch threw:", String(e));
  }

  return new NextResponse(null, { status: 204 });
}

// "Today's midnight in Denver, expressed as a UTC ISO string." Used as
// the lower bound of the day's row query. Works through DST changes
// because it derives the offset from the OS's tz database rather
// than hard-coding -6/-7.
//
// Method:
//   1. Ask Intl what calendar date it is in Denver right now.
//   2. UTC midnight of that date is some prior moment (Denver is
//      always 6 or 7 hours behind UTC, so UTC midnight reads as 17:00
//      or 18:00 the prior day in Denver).
//   3. Denver-true midnight = UTC midnight + (24 - that-reported-hour)
//      hours.
function denverDayStartUtcIso(now: Date): string {
  const datePart = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const utcMidnight = new Date(datePart + "T00:00:00Z");
  const denverHourAtUtcMidnight = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Denver",
      hour: "2-digit",
      hour12: false,
    }).format(utcMidnight),
    10
  );
  // Denver is always behind UTC, so this hour is 17 or 18 (prior day).
  const offsetHours = 24 - denverHourAtUtcMidnight;
  return new Date(utcMidnight.getTime() + offsetHours * 3600000).toISOString();
}
