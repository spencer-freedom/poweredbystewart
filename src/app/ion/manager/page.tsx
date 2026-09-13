import { promises as fs } from "node:fs";
import path from "node:path";
import type { TriageIndex } from "./types";
import { ManagerApp } from "./ManagerApp.client";

export const dynamic = "force-dynamic";

// /ion/manager — the interactive manager surface. Every processed call,
// ranked by a deterministic triage score whose weights are on screen and
// editable; a per-rep view; and the full Stewart read one click away.
// Lives outside the (public) route group so it renders bare (its own
// header) — it's a product screen, not a pitch page. AppShell already
// bypasses its sidebar for any /ion* path.

async function loadTriage(): Promise<TriageIndex> {
  const filePath = path.join(process.cwd(), "public", "ion", "triage-index.json");
  return JSON.parse(await fs.readFile(filePath, "utf-8")) as TriageIndex;
}

export default async function IonManagerPage() {
  const index = await loadTriage();
  return <ManagerApp index={index} />;
}
