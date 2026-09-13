import { promises as fs } from "node:fs";
import path from "node:path";
import type { TriageIndex } from "../types";
import { TeamBrief } from "./TeamBrief.client";

export const dynamic = "force-dynamic";

// /ion/manager/brief — the morning brief, by rep. Ranked live from the
// corpus (public/ion/triage-index.json); embedded in the phone frame on
// /ion/present and usable standalone on a real phone. The full manager
// surface is one level up at /ion/manager.

export default async function IonManagerBriefPage() {
  const raw = await fs.readFile(path.join(process.cwd(), "public", "ion", "triage-index.json"), "utf-8");
  const index = JSON.parse(raw) as TriageIndex;
  return (
    <div className="min-h-screen bg-stewart-bg">
      <TeamBrief index={index} />
    </div>
  );
}
