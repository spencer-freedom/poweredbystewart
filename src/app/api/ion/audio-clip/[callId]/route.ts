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

  // Accept any of the var names Spencer's projects use for these two:
  //   URL  : SUPABASE_URL  OR  NEXT_PUBLIC_SUPABASE_URL
  //   KEY  : SUPABASE_SERVICE_ROLE_KEY  OR  SUPABASE_SERVICE_KEY
  // Falling back to the public URL name is safe (URL isn't secret;
  // only the service key is). SUPABASE_SERVICE_KEY is the legacy
  // name on the poweredbystewart project; SUPABASE_SERVICE_ROLE_KEY
  // is Supabase's current canonical name.
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      {
        error: "Supabase env not configured",
        runtime_env_presence: {
          SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
          NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
          SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          SUPABASE_SERVICE_KEY: Boolean(process.env.SUPABASE_SERVICE_KEY),
          NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        },
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
