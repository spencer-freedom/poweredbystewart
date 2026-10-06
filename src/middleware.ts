import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { SHOWCASE, SHOWCASE_ORDER } from "./app/ion/call/showcase";

// Clerk sets session cookies everywhere. Server-side protection is applied
// to the Ion surfaces only: every /ion page, every /ion/*.json data file,
// and the /api/ion routes (audio clips, narration, saves). A sign-up page
// exists, so "signed in" is not enough — the signed-in user also has to be
// on the allowlist. Default is Spencer; ION_ALLOWED_EMAILS (comma-separated)
// extends it without a deploy of code.

const isIon = createRouteMatcher(["/ion(.*)", "/api/ion(.*)"]);

// The one public Ion surface: the three-call demo at /ion/call, outputs only.
// It needs two API routes, opened just far enough to serve that page:
//   - whole-call audio only for the three showcase calls; clip windows
//     (start+end) for any call, since the "beyond this call" tape plays
//     other reps' moments;
//   - the cloned-voice route only for the exact lines on the page, so the
//     voices can't be made to say anything else.
const norm = (t: string) => t.replace(/\s+/g, " ").trim();
const ALT_LINES = new Set(Object.values(SHOWCASE).map((s) => norm(s.miss.text)));
function isPublicDemo(req: { nextUrl: URL }): boolean {
  const { pathname, searchParams } = req.nextUrl;
  if (pathname === "/ion/call") return true;
  if (pathname.startsWith("/api/ion/audio-clip/")) {
    const id = decodeURIComponent(pathname.slice("/api/ion/audio-clip/".length));
    const clip = searchParams.has("start") && searchParams.has("end");
    return clip || SHOWCASE_ORDER.includes(id);
  }
  if (pathname === "/api/ion/alt-take") {
    return ALT_LINES.has(norm(searchParams.get("text") || ""));
  }
  return false;
}

const ALLOWED = new Set(
  (process.env.ION_ALLOWED_EMAILS || "manager@getthriftyprovo.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

export default clerkMiddleware(async (auth, req) => {
  if (!isIon(req)) return;
  if (isPublicDemo(req)) return;
  // Local screenshots and layout work only: never honoured in production.
  if (process.env.NODE_ENV !== "production" && process.env.ION_GATE_OFF === "1") return;
  const { userId, sessionClaims, redirectToSignIn } = await auth();
  if (!userId) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
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
    return new NextResponse("Not available.", { status: 403 });
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
