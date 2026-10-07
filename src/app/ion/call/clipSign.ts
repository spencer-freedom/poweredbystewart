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
