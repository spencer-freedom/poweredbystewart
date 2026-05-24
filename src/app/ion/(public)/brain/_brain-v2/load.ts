import { promises as fs } from "node:fs";
import path from "node:path";
import type { BrainV2Payload } from "./types";

// Server-side payload loader. The build pipeline writes
// public/ion/brain-v2-payload.json; we read once at request time and
// stream the whole thing to the client.
//
// Payload is ~1.3MB raw, gzip compresses well (~250KB on the wire).
// 332 planets × moon arrays × tile array fit comfortably; no need to
// split into multiple files for V2.

export async function loadBrainV2(): Promise<BrainV2Payload> {
  const filePath = path.join(
    process.cwd(),
    "public",
    "ion",
    "brain-v2-payload.json"
  );
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as BrainV2Payload;
}
