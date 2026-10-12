import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { tapeToken } from "../../../ion/call/clipSign";
import { beyondTypeFor, loadRows, tapeFor } from "../../../ion/call/tape";

// GET /api/ion/beyond?call=<showcase call>&rep=<name>&t=<token>
// One rep's tape against the no that call 3 is about. The token was signed
// by the page's server for exactly this (call, rep); the middleware checks
// it before the request gets here, and this checks it again.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const call = u.searchParams.get("call") ?? "";
  const rep = u.searchParams.get("rep") ?? "";
  const t = u.searchParams.get("t") ?? "";
  const want = tapeToken(call, rep);
  if (!call || !rep || t.length !== want.length || !timingSafeEqual(Buffer.from(t), Buffer.from(want))) {
    return NextResponse.json({ error: "Not available" }, { status: 401 });
  }
  const type = beyondTypeFor(call);
  if (!type) return NextResponse.json({ clips: [] });
  return NextResponse.json({ clips: tapeFor(loadRows(), type, call, rep) }, { headers: { "Cache-Control": "private, max-age=300" } });
}
