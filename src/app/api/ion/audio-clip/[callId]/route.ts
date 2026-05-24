import { spawn } from "node:child_process";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import ffmpegPath from "ffmpeg-static";

// Audio clip endpoint. Two modes:
//
//  1. Bare call URL  (no start/end)        → 302 redirect to the
//                                              signed Supabase MP3.
//                                              Browser plays the full
//                                              file natively.
//
//  2. Clip URL       (?start=N&end=M)      → server-side ffmpeg slice.
//                                              Downloads the source
//                                              from Supabase, runs
//                                              ffmpeg with -ss/-t,
//                                              streams the resulting
//                                              MP3 (just the requested
//                                              window) back. Native
//                                              <audio> controls show
//                                              the clip's actual
//                                              duration; no client-side
//                                              seek hacks needed.
//
// Cache-Control on clip responses lets Vercel's edge CDN serve repeat
// requests for the same (callId, start, end) without re-running ffmpeg.

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "ion-call-audio";
const KEY_PREFIX = "ion_solar";
const URL_TTL_SECONDS = 3600;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  const { callId } = await params;

  if (!callId || !/^[A-Za-z0-9_-]+$/.test(callId)) {
    return NextResponse.json({ error: "invalid callId" }, { status: 400 });
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Supabase env not configured" },
      { status: 500 }
    );
  }

  const startParam = req.nextUrl.searchParams.get("start");
  const endParam = req.nextUrl.searchParams.get("end");
  const start = startParam !== null ? parseFloat(startParam) : null;
  const end = endParam !== null ? parseFloat(endParam) : null;
  const wantClip =
    start !== null && end !== null && !isNaN(start) && !isNaN(end) && end > start;

  // Sign the Supabase URL (same flow for both modes — full and clip
  // both need to fetch the source).
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
    return NextResponse.json(
      { error: "no signedURL in supabase response" },
      { status: 502 }
    );
  }
  const fullUrl = `${supabaseUrl}/storage/v1${signedURL}`;

  // Full-call mode: redirect (browser streams direct from Supabase).
  if (!wantClip) {
    return NextResponse.redirect(fullUrl, 302);
  }

  // Clip mode: ffmpeg slice. Cap duration to 5 minutes as a safety
  // belt — a runaway client shouldn't be able to fan out into an
  // arbitrarily long clip.
  const duration = Math.min(300, end! - start!);
  if (!ffmpegPath) {
    // ffmpeg-static failed to resolve (shouldn't happen on Linux Vercel
    // runtime). Fall back to the redirect so audio still plays — just
    // without server-side trim.
    return NextResponse.redirect(fullUrl, 302);
  }

  // Fetch source from Supabase, write to /tmp so ffmpeg can seek.
  // 11-min Ion calls are ~10MB MP3 — comfortable inside the 512MB /tmp
  // limit. Each request is independent (no shared cache across
  // invocations), but Vercel edge caching on our response below means
  // repeat requests for the same (callId, start, end) skip this work.
  let sourceRes: Response;
  try {
    sourceRes = await fetch(fullUrl);
  } catch (e) {
    return NextResponse.json(
      { error: "source fetch failed", detail: String(e) },
      { status: 502 }
    );
  }
  if (!sourceRes.ok || !sourceRes.body) {
    return NextResponse.json(
      { error: "source fetch failed", status: sourceRes.status },
      { status: 502 }
    );
  }

  const tmpDir = path.join(tmpdir(), "ion-audio");
  await mkdir(tmpDir, { recursive: true });
  const sourcePath = path.join(
    tmpDir,
    `${callId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`
  );
  try {
    const arrayBuf = await sourceRes.arrayBuffer();
    await writeFile(sourcePath, Buffer.from(arrayBuf));
  } catch (e) {
    return NextResponse.json(
      { error: "source write failed", detail: String(e) },
      { status: 500 }
    );
  }

  // Spawn ffmpeg. -ss before -i is fast (input-side seek) and accurate
  // enough for MP3 frame boundaries. -c:a copy keeps things light —
  // no re-encoding — and the slice's duration metadata reflects the
  // actual window, so the browser's <audio> controls display the
  // right total time.
  const ff = spawn(ffmpegPath, [
    "-hide_banner",
    "-loglevel", "error",
    "-ss", start!.toFixed(3),
    "-i", sourcePath,
    "-t", duration.toFixed(3),
    "-c:a", "copy",
    "-f", "mp3",
    "-",
  ]);

  // Collect ffmpeg's stdout into a buffer, then return as the
  // response body. Streaming via ReadableStream is unreliable on
  // small payloads — Next.js's Response adapter sometimes closes
  // before chunks arrive. Buffering is simple, deterministic, and
  // ~50KB clips are tiny relative to the function's memory budget.
  const stdoutChunks: Buffer[] = [];
  const stderrChunks: Buffer[] = [];
  ff.stdout.on("data", (c: Buffer) => stdoutChunks.push(c));
  ff.stderr.on("data", (c: Buffer) => stderrChunks.push(c));

  const exitCode: number = await new Promise((resolve) => {
    ff.on("close", (code) => resolve(code ?? -1));
    ff.on("error", () => resolve(-1));
  });

  // Best-effort cleanup. /tmp on Vercel doesn't persist across
  // invocations, so a leaked file would be harmless anyway.
  unlink(sourcePath).catch(() => {});

  if (exitCode !== 0) {
    return NextResponse.json(
      {
        error: "ffmpeg failed",
        code: exitCode,
        stderr: Buffer.concat(stderrChunks).toString("utf-8").slice(0, 400),
      },
      { status: 500 }
    );
  }

  const body = Buffer.concat(stdoutChunks);
  return new Response(body, {
    headers: {
      "content-type": "audio/mpeg",
      "content-length": String(body.byteLength),
      // Identical (callId, start, end) requests are stable — edge
      // cache them aggressively. 24h matches the demo cadence; bump
      // if you start hitting cold caches.
      "cache-control": "public, max-age=86400, s-maxage=86400, immutable",
    },
  });
}
