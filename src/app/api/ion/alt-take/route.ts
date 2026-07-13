import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { voiceIdForRep } from "./repVoices";

// "Could've said" alt-take endpoint.
//
//   GET /api/ion/alt-take?rep=Joel&text=...&phone=1
//
// Generates a line of speech in the rep's cloned voice (ElevenLabs), caches
// the MP3 in Supabase Storage, and 302-redirects to a signed URL. Identical
// (voice, phone, text) requests are deduped by content hash — so an author
// can "pre-generate" a line before the pitch and playback is instant/CDN.
//
//   phone=1 (default) band-limits the audio to match real call texture so it
//   sits seamlessly next to the actual clip; phone=0 returns studio-clean TTS.
//
// Mirrors the audio-clip route: same Supabase sign flow, same ffmpeg-static.

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "ion-call-audio";
const KEY_PREFIX = "ion_solar/alt-takes";
const URL_TTL_SECONDS = 3600;
const MAX_TEXT_LEN = 600;
const EL_MODEL = "eleven_multilingual_v2";

function supabaseEnv() {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  return { url, serviceKey };
}

// Sign an object; returns the full signed URL, or null if it doesn't exist.
async function signIfExists(
  supabaseUrl: string,
  serviceKey: string,
  objectPath: string
): Promise<string | null> {
  const res = await fetch(
    `${supabaseUrl}/storage/v1/object/sign/${BUCKET}/${objectPath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: URL_TTL_SECONDS }),
    }
  );
  if (!res.ok) return null;
  const { signedURL } = (await res.json()) as { signedURL?: string };
  return signedURL ? `${supabaseUrl}/storage/v1${signedURL}` : null;
}

export async function GET(req: NextRequest) {
  const { url: supabaseUrl, serviceKey } = supabaseEnv();
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Supabase env not configured" }, { status: 500 });
  }
  if (!elevenKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });
  }

  const rep = (req.nextUrl.searchParams.get("rep") || "").trim();
  const text = (req.nextUrl.searchParams.get("text") || "").trim();
  const phone = req.nextUrl.searchParams.get("phone") !== "0"; // default on

  const voiceId = voiceIdForRep(rep);
  if (!voiceId) {
    return NextResponse.json(
      { error: `no cloned voice for rep '${rep}'` },
      { status: 404 }
    );
  }
  if (!text || text.length > MAX_TEXT_LEN) {
    return NextResponse.json(
      { error: `text must be 1..${MAX_TEXT_LEN} chars` },
      { status: 400 }
    );
  }

  // Content-addressed cache key — same inputs never regenerate.
  const hash = createHash("sha256")
    .update(`${voiceId}|${EL_MODEL}|phone=${phone ? 1 : 0}|${text}`)
    .digest("hex")
    .slice(0, 32);
  const objectPath = `${KEY_PREFIX}/${rep}/${hash}.mp3`;

  // Cache hit → redirect straight to the signed URL (Supabase CDN serves it).
  const cached = await signIfExists(supabaseUrl, serviceKey, objectPath);
  if (cached) return NextResponse.redirect(cached, 302);

  // Miss → generate with ElevenLabs.
  let ttsBuf: Buffer;
  try {
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": elevenKey,
          accept: "audio/mpeg",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: EL_MODEL,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.85,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );
    if (!ttsRes.ok) {
      const body = await ttsRes.text();
      return NextResponse.json(
        { error: "elevenlabs tts failed", status: ttsRes.status, body: body.slice(0, 400) },
        { status: 502 }
      );
    }
    ttsBuf = Buffer.from(await ttsRes.arrayBuffer());
  } catch (e) {
    return NextResponse.json({ error: "tts fetch failed", detail: String(e) }, { status: 502 });
  }

  // Optional phone-match: band-limit + gentle compression so it matches the
  // real call audio texture. Falls back to raw TTS if ffmpeg is unavailable.
  let outBuf = ttsBuf;
  if (phone) {
    try {
      outBuf = await phoneMatch(ttsBuf);
    } catch {
      outBuf = ttsBuf; // never fail the request over the cosmetic filter
    }
  }

  // Persist to Supabase (upsert) so re-plays and future pitches are instant.
  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/${BUCKET}/${objectPath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "audio/mpeg",
        "x-upsert": "true",
      },
      body: new Uint8Array(outBuf),
    }
  );
  const playBytes = () =>
    new Response(new Uint8Array(outBuf), {
      headers: {
        "content-type": "audio/mpeg",
        "content-length": String(outBuf.byteLength),
        "cache-control": "public, max-age=3600",
      },
    });
  if (!uploadRes.ok) {
    // Upload failed — still play it this time by returning bytes directly.
    return playBytes();
  }

  const signed = await signIfExists(supabaseUrl, serviceKey, objectPath);
  if (signed) return NextResponse.redirect(signed, 302);
  // Signed URL somehow unavailable — return the bytes we just made.
  return playBytes();
}

// Run ffmpeg to band-limit TTS toward telephone texture. ffmpeg-static is a
// soft dependency loaded here so a missing package/binary degrades to raw TTS
// (caller catches) instead of crashing the route module at import time.
async function phoneMatch(input: Buffer): Promise<Buffer> {
  // @ts-ignore — optional native dep; types/binary present on Vercel, absent in some sandboxes
  const mod = await import("ffmpeg-static").catch(() => null);
  const ffmpegPath = (mod?.default ?? null) as string | null;
  if (!ffmpegPath) throw new Error("ffmpeg-static unavailable");

  const dir = path.join(tmpdir(), "ion-alt-take");
  await mkdir(dir, { recursive: true });
  const inPath = path.join(dir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`);
  await writeFile(inPath, new Uint8Array(input));

  const ff = spawn(ffmpegPath, [
    "-hide_banner",
    "-loglevel", "error",
    "-i", inPath,
    "-af",
    "highpass=f=300,lowpass=f=3400,acompressor=threshold=-18dB:ratio=3:attack=5:release=60,volume=2dB",
    "-ac", "1",
    "-ar", "44100",
    "-b:a", "128k",
    "-f", "mp3",
    "-",
  ]);

  const out: Buffer[] = [];
  const err: Buffer[] = [];
  ff.stdout.on("data", (c: Buffer) => out.push(c));
  ff.stderr.on("data", (c: Buffer) => err.push(c));
  const code: number = await new Promise((resolve) => {
    ff.on("close", (c) => resolve(c ?? -1));
    ff.on("error", () => resolve(-1));
  });
  unlink(inPath).catch(() => {});
  if (code !== 0) {
    throw new Error(`ffmpeg exit ${code}: ${Buffer.concat(err).toString().slice(0, 300)}`);
  }
  return Buffer.concat(out);
}
