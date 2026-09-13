import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

// Narration for the morning brief.
//
//   GET /api/ion/narrate?text=...
//
// Stewart's voice reading a line of the brief (ElevenLabs, studio-clean —
// it's the narrator, not a rep). Cached by content hash in Supabase
// Storage exactly like the alt-take route, so a brief that was played once
// is instant every morning after. Voice: ELEVENLABS_NARRATOR_VOICE_ID, else
// the first premade voice on the account (resolved once per process).

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "ion-call-audio";
const KEY_PREFIX = "ion_solar/narration";
const URL_TTL_SECONDS = 3600;
const MAX_TEXT_LEN = 900;
const EL_MODEL = "eleven_multilingual_v2";

let resolvedVoice: string | null = null;

async function narratorVoice(elevenKey: string): Promise<string | null> {
  if (process.env.ELEVENLABS_NARRATOR_VOICE_ID) return process.env.ELEVENLABS_NARRATOR_VOICE_ID;
  if (resolvedVoice) return resolvedVoice;
  const res = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": elevenKey } });
  if (!res.ok) return null;
  const data = (await res.json()) as { voices?: { voice_id: string; category?: string; name?: string }[] };
  const premade = (data.voices ?? []).filter((v) => v.category === "premade");
  // A calm, neutral narrator reads better in a car than a character voice.
  const pick =
    premade.find((v) => /^(daniel|george|brian|liam|matilda|sarah)$/i.test(v.name ?? "")) ?? premade[0] ?? data.voices?.[0];
  resolvedVoice = pick?.voice_id ?? null;
  return resolvedVoice;
}

function supabaseEnv() {
  return {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  };
}

async function signIfExists(supabaseUrl: string, serviceKey: string, objectPath: string): Promise<string | null> {
  const res = await fetch(`${supabaseUrl}/storage/v1/object/sign/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: URL_TTL_SECONDS }),
  });
  if (!res.ok) return null;
  const { signedURL } = (await res.json()) as { signedURL?: string };
  return signedURL ? `${supabaseUrl}/storage/v1${signedURL}` : null;
}

export async function GET(req: NextRequest) {
  const { url: supabaseUrl, serviceKey } = supabaseEnv();
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: "Supabase env not configured" }, { status: 500 });
  if (!elevenKey) return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });

  const text = (req.nextUrl.searchParams.get("text") || "").trim();
  if (!text || text.length > MAX_TEXT_LEN) return NextResponse.json({ error: `text must be 1..${MAX_TEXT_LEN} chars` }, { status: 400 });

  const voiceId = await narratorVoice(elevenKey);
  if (!voiceId) return NextResponse.json({ error: "no narrator voice available" }, { status: 502 });

  const hash = createHash("sha256").update(`${voiceId}|${EL_MODEL}|${text}`).digest("hex").slice(0, 32);
  const objectPath = `${KEY_PREFIX}/${hash}.mp3`;

  const cached = await signIfExists(supabaseUrl, serviceKey, objectPath);
  if (cached) return NextResponse.redirect(cached, 302);

  let buf: Buffer;
  try {
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": elevenKey, accept: "audio/mpeg", "content-type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: EL_MODEL,
        voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.1, use_speaker_boost: true },
      }),
    });
    if (!ttsRes.ok) {
      const body = await ttsRes.text();
      return NextResponse.json({ error: "elevenlabs tts failed", status: ttsRes.status, body: body.slice(0, 300) }, { status: 502 });
    }
    buf = Buffer.from(await ttsRes.arrayBuffer());
  } catch (e) {
    return NextResponse.json({ error: "tts fetch failed", detail: String(e) }, { status: 502 });
  }

  const upload = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Content-Type": "audio/mpeg", "x-upsert": "true" },
    body: new Uint8Array(buf),
  });
  const bytes = () =>
    new Response(new Uint8Array(buf), {
      headers: { "content-type": "audio/mpeg", "content-length": String(buf.byteLength), "cache-control": "public, max-age=3600" },
    });
  if (!upload.ok) return bytes();
  const signed = await signIfExists(supabaseUrl, serviceKey, objectPath);
  return signed ? NextResponse.redirect(signed, 302) : bytes();
}
