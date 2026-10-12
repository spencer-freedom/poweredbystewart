import { createHmac } from "node:crypto";

// Server-only. Every clip URL the public demo emits is signed over
// (call, start, end), and the middleware lets an unsigned-in request slice
// audio only when the signature checks out. So the tape a visitor can pull is
// exactly the tape on the page, and nothing else in the corpus.
// The key is ION_CLIP_SECRET, falling back to the Clerk secret so it works
// without a new variable; the middleware reads the same two.
const secret = () => process.env.ION_CLIP_SECRET || process.env.CLERK_SECRET_KEY || "";

export function clipSrc(callId: string, start: number, end: number): string {
  const s = Math.max(0, start).toFixed(3);
  const e = Math.max(0, end).toFixed(3);
  const sig = createHmac("sha256", secret()).update(`${callId}|${s}|${e}`).digest("hex").slice(0, 24);
  return `/api/ion/audio-clip/${encodeURIComponent(callId)}?start=${s}&end=${e}&sig=${sig}`;
}

// The "beyond this call" tape is fetched per rep, on click, with a token the
// page's server signed over (call, rep). So the page source names reps and
// counts, and nothing else: no other call's audio URL is in it.
export function tapeToken(callId: string, rep: string): string {
  return createHmac("sha256", secret()).update(`tape|${callId}|${rep}`).digest("hex").slice(0, 24);
}
export function tapeSrc(callId: string, rep: string): string {
  return `/api/ion/beyond?call=${encodeURIComponent(callId)}&rep=${encodeURIComponent(rep)}&t=${tapeToken(callId, rep)}`;
}
