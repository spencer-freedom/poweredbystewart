import { NextRequest, NextResponse } from "next/server";

// Signs a private Supabase Storage URL for the requested Ion call audio
// and redirects to it. Bucket layout (owned by SpencerOS):
//   bucket: ion-call-audio
//   key:    ion_solar/{callId}.mp3
//
// `start` and `end` query params are accepted but currently ignored on the
// server (full file is returned). Real per-clip slicing will come later;
// browser controls handle scrub/stop for the demo.

const BUCKET = "ion-call-audio";
const KEY_PREFIX = "ion_solar";
const URL_TTL_SECONDS = 3600;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  const { callId } = await params;

  if (!callId || !/^[A-Za-z0-9_\-]+$/.test(callId)) {
    return NextResponse.json({ error: "invalid callId" }, { status: 400 });
  }

  // Accept either the server-only var name or the public one — the
  // poweredbystewart Vercel project sets NEXT_PUBLIC_SUPABASE_URL for
  // client-side Supabase access; reusing it server-side here is fine
  // (the URL prefix isn't secret; only SUPABASE_SERVICE_ROLE_KEY is).
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    // Non-leaky diagnostic — booleans only, no values exposed. Tells us
    // exactly which env vars the runtime is or isn't getting. This is
    // safe to ship to prod: it reveals presence, not content.
    return NextResponse.json(
      {
        error: "Supabase env not configured",
        runtime_env_presence: {
          SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
          NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
          SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        },
        hint: "If any expected key shows false here, that var isn't reaching the production route handler. Check Vercel project Settings → Environment Variables, confirm the var has Production scope, then force a fresh redeploy.",
      },
      { status: 500 }
    );
  }

  const objectPath = `${KEY_PREFIX}/${callId}.mp3`;
  const signEndpoint = `${supabaseUrl}/storage/v1/object/sign/${BUCKET}/${objectPath}`;

  const signRes = await fetch(signEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: URL_TTL_SECONDS }),
  });

  if (!signRes.ok) {
    const body = await signRes.text();
    return NextResponse.json(
      { error: "supabase sign failed", status: signRes.status, body },
      { status: 502 }
    );
  }

  const { signedURL } = (await signRes.json()) as { signedURL?: string };
  if (!signedURL) {
    return NextResponse.json({ error: "no signedURL in supabase response" }, { status: 502 });
  }

  const fullUrl = `${supabaseUrl}/storage/v1${signedURL}`;
  return NextResponse.redirect(fullUrl, 302);
}
