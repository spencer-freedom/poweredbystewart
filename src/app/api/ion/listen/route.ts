import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// POST /api/ion/listen — beacons from the players and the presence ping.
// Writes a 'listen' or 'ping' row to ion_access_log with the seconds, so
// the visits page can sum tape played and time on the page per person.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (req.headers.get("x-stewart-probe") === "1") return new NextResponse(null, { status: 204 }); // Claude's own checks
  let body: { kind?: string; seconds?: number; src?: string; page?: string } = {};
  try { body = JSON.parse(await req.text()); } catch { return new NextResponse(null, { status: 204 }); }
  const kind = body.kind === "listen" ? "listen" : body.kind === "ping" ? "ping" : null;
  const seconds = Math.round(Number(body.seconds));
  if (!kind || !Number.isFinite(seconds) || seconds < 1 || seconds > 600) return new NextResponse(null, { status: 204 });
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return new NextResponse(null, { status: 204 });

  let email: string | null = null;
  try {
    const { userId, sessionClaims } = await auth();
    if (userId) {
      email = ((sessionClaims as { email?: string } | null)?.email ?? null)?.toLowerCase() ?? null;
      if (!email) { const c = await clerkClient(); email = (await c.users.getUser(userId)).primaryEmailAddress?.emailAddress?.toLowerCase() ?? null; }
    }
  } catch { email = null; }

  const h = req.headers;
  const dec = (v: string | null) => { try { return v ? decodeURIComponent(v) : null; } catch { return v; } };
  const row = {
    path: kind === "listen" ? String(body.src ?? "").slice(0, 300) : String(body.page ?? "").slice(0, 120),
    query: kind === "listen" ? String(body.page ?? "").slice(0, 120) : null,
    decision: kind, seconds,
    ip: h.get("x-real-ip") || (h.get("x-forwarded-for") || "").split(",")[0].trim() || null,
    ua: (h.get("user-agent") || "").slice(0, 400) || null,
    referer: h.get("referer"), country: h.get("x-vercel-ip-country"), region: h.get("x-vercel-ip-country-region"), city: dec(h.get("x-vercel-ip-city")),
    email,
  };
  await fetch(`${url}/rest/v1/ion_access_log`, {
    method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(row),
  }).catch(() => {});
  return new NextResponse(null, { status: 204 });
}
