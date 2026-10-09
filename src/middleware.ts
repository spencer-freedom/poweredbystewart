import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SHOWCASE, SHOWCASE_ORDER } from "./app/ion/call/showcase";

// Clerk sets session cookies everywhere. Server-side protection is applied
// to the Ion surfaces only: every /ion page, every /ion/*.json data file,
// and the /api/ion routes (audio clips, narration, saves). A sign-up page
// exists, so "signed in" is not enough — the signed-in user also has to be
// on the allowlist. Default is Spencer (both of his addresses); ION_ALLOWED_EMAILS (comma-separated)
// extends it without a deploy of code.

const isIon = createRouteMatcher(["/ion(.*)", "/api/ion(.*)"]);

// The one public Ion surface: the three-call demo at /ion/call, outputs only.
// It needs two API routes, opened just far enough to serve that page:
//   - whole-call audio only for the three showcase calls; a clip window
//     (start+end) only with the signature the page's server put on it, so a
//     visitor can pull exactly the tape on the page and nothing else;
//   - the cloned-voice route only for the exact lines on the page, in the
//     voice the page pairs them with, so the voices can't be made to say
//     anything else.
const norm = (t: string) => t.replace(/\s+/g, " ").trim();
const ALT_LINES = new Set(Object.values(SHOWCASE).flatMap((s) => s.misses.map((m) => `${s.voice}|${norm(m.text)}`)));
const CLIP_SECRET = process.env.ION_CLIP_SECRET || process.env.CLERK_SECRET_KEY || "";
async function clipSigOk(id: string, sp: URLSearchParams): Promise<boolean> {
  const start = sp.get("start"), end = sp.get("end"), sig = sp.get("sig");
  if (!start || !end || !sig || !CLIP_SECRET) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(CLIP_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${id}|${start}|${end}`)));
  const hex = Array.from(mac).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
  return hex.length === sig.length && hex === sig;
}
// What the public demo lets through, by kind — or null, which means the gate.
type Public = "page" | "clip" | "full" | "voice";
async function publicKind(req: { nextUrl: URL }): Promise<Public | null> {
  const { pathname, searchParams } = req.nextUrl;
  if (pathname === "/ion/call" || pathname === "/ion/call2" || pathname === "/ion/call3") return "page";
  if (pathname.startsWith("/api/ion/audio-clip/")) {
    const id = decodeURIComponent(pathname.slice("/api/ion/audio-clip/".length));
    if (searchParams.has("start") || searchParams.has("end")) return (await clipSigOk(id, searchParams)) ? "clip" : null;
    return SHOWCASE_ORDER.includes(id) ? "full" : null;
  }
  if (pathname === "/api/ion/alt-take") {
    return ALT_LINES.has(`${searchParams.get("rep") || ""}|${norm(searchParams.get("text") || "")}`) ? "voice" : null;
  }
  return null;
}

// Scripted visitors are turned away from the public demo: the known AI
// crawlers and the HTTP libraries an agent reaches for first. A real browser
// driven by a person (or by an agent that bothers to use one) still gets in —
// the page is meant to be seen, and there is nothing behind it to take.
const SCRIPTED = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-User|Claude-SearchBot|Claude-Web|anthropic-ai|PerplexityBot|Perplexity-User|Bytespider|CCBot|Google-Extended|Applebot-Extended|cohere-ai|Diffbot|Amazonbot|meta-externalagent|FacebookBot|YouBot|DuckAssistBot|Timpibot|Omgili|ImagesiftBot|AI2Bot|PetalBot|Scrapy|python-requests|python-urllib|aiohttp|httpx|Go-http-client|curl\/|Wget|libwww|okhttp|axios|node-fetch|undici|HeadlessChrome|PhantomJS|Puppeteer|Playwright/i;
const scripted = (ua: string) => !ua || SCRIPTED.test(ua);

// Every request under /ion and /api/ion is written to ion_access_log with what
// the gate decided, after the response is on its way (waitUntil), so a visit
// can be read back later: which pages, which clips, which voices, and whether
// anything was probed that the page never asked for. /ion/visits reads it.
type Decision = Public | "preview" | "bot" | "probe" | "gated" | "denied" | "allowed";
// Messaging apps fetch the page once to draw the link card in a text. That
// is served (the card is wanted) but logged as a preview, not a visit: it
// means the link was just sent to someone, not that anyone read it.
const PREVIEW = /GoogleMessages|facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|LinkedInBot|TelegramBot|Discordbot|iMessageLinkPreview|Applebot|SkypeUriPreview|Snapchat|Viber/i;
function log(req: NextRequest, event: NextFetchEvent, decision: Decision, email?: string | null, note?: string | null) {
  // Claude's own checks from Spencer's machine carry this header so they
  // never show up on the visits page as a visitor.
  if (req.headers.get("x-stewart-probe") === "1") return;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return;
  const h = req.headers;
  const dec = (v: string | null) => { try { return v ? decodeURIComponent(v) : null; } catch { return v; } };
  const row = {
    path: req.nextUrl.pathname,
    query: req.nextUrl.search ? req.nextUrl.search.slice(0, 500) : null,
    decision,
    ip: h.get("x-real-ip") || (h.get("x-forwarded-for") || "").split(",")[0].trim() || null,
    ua: (h.get("user-agent") || "").slice(0, 400) || null,
    referer: h.get("referer"),
    country: h.get("x-vercel-ip-country"),
    region: h.get("x-vercel-ip-country-region"),
    city: dec(h.get("x-vercel-ip-city")),
    email: email ?? null,
    note: note ?? null,
  };
  event.waitUntil(
    fetch(`${url}/rest/v1/ion_access_log`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
    }).catch(() => {}),
  );
}

const ALLOWED = new Set(
  (process.env.ION_ALLOWED_EMAILS || "manager@getthriftyprovo.com,spencer.freedom@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

export default clerkMiddleware(async (auth, req, event) => {
  if (!isIon(req)) return;
  const kind = await publicKind(req);
  if (kind) {
    if (PREVIEW.test(req.headers.get("user-agent") || "")) {
      log(req, event, "preview");
      return;
    }
    if (scripted(req.headers.get("user-agent") || "")) {
      log(req, event, "bot");
      return new NextResponse("Not available.", { status: 403 });
    }
    log(req, event, kind);
    return;
  }
  // Local screenshots and layout work only: never honoured in production.
  if (process.env.NODE_ENV !== "production" && process.env.ION_GATE_OFF === "1") return;
  const authObj = await auth();
  const { userId, sessionClaims, redirectToSignIn } = authObj;
  if (!userId) {
    // Clerk's own account of why this request has no session (token missing,
    // signature rejected, key mismatch...) goes into the log's note, so a
    // signed-in person being turned away can be diagnosed from the log alone.
    const dbg = (authObj as unknown as { debug?: () => Record<string, unknown> }).debug?.() ?? {};
    const why = [dbg.status, dbg.reason, dbg.message].filter(Boolean).join(" | ").slice(0, 300) || null;
    const hasCookies = ["__session", "__client_uat"].filter((c) => req.cookies.has(c)).join("+") || "no clerk cookies";
    if (req.nextUrl.pathname.startsWith("/api/")) {
      log(req, event, "probe", null, `${hasCookies}; ${why ?? ""}`);
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
    log(req, event, "gated", null, `${hasCookies}; ${why ?? ""}`);
    return redirectToSignIn({ returnBackUrl: req.url });
  }
  // Email from the session token when the Clerk dashboard adds it to the
  // claims; otherwise one user lookup. Ion traffic is a handful of people.
  let email = (sessionClaims as { email?: string } | null)?.email?.toLowerCase();
  if (!email) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
    } catch {
      email = undefined;
    }
  }
  if (!email || !ALLOWED.has(email)) {
    log(req, event, "denied", email);
    return new NextResponse("Not available.", { status: 403 });
  }
  log(req, event, "allowed", email);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
