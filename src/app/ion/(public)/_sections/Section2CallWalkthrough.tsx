import { promises as fs } from "node:fs";
import path from "node:path";
import { ScrollSection } from "./ScrollSection";
import { CallWalkthrough } from "./session10/CallWalkthrough.client";
import { PipelineFlow } from "../_visuals";
import type {
  CallBundle,
  CherryPick,
  Handoff,
  ManagerBrief,
  Metadata,
} from "./session10/types";

// Server component. Reads the SESSION10 / SESSION18 demo card JSONs
// from public/ion/ at request time (the files were shipped there by
// the session10-cards brief) and passes typed bundles to the
// interactive client component that handles moment selection + audio.
//
// Files we expect (8 total):
//   session10_eb080f7c-manager-brief.json
//   session10_eb080f7c-cherrypicks.json
//   session10_eb080f7c-metadata.json
//   session10_eb080f7c-trajectory-full.json  (consumed by "see more" UI)
//   session18_fd078269-manager-brief.json
//   session18_fd078269-cherrypicks.json
//   session18_fd078269-handoff.json
//   session18_fd078269-metadata.json

async function loadJson<T>(filename: string): Promise<T> {
  const filePath = path.join(process.cwd(), "public", "ion", filename);
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function loadBundle(
  prefix: string,
  withHandoff: boolean
): Promise<CallBundle> {
  const [managerBrief, cherryPicks, metadata, handoff] = await Promise.all([
    loadJson<ManagerBrief>(`${prefix}-manager-brief.json`),
    loadJson<CherryPick[]>(`${prefix}-cherrypicks.json`),
    loadJson<Metadata>(`${prefix}-metadata.json`),
    withHandoff ? loadJson<Handoff>(`${prefix}-handoff.json`) : undefined,
  ]);
  return { managerBrief, cherryPicks, metadata, handoff };
}

export async function Section2CallWalkthrough() {
  const [session10, session18] = await Promise.all([
    loadBundle("session10_eb080f7c", false),
    loadBundle("session18_fd078269", true),
  ]);

  return (
    <ScrollSection id="how-a-call-processes">
      <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
        What it does
      </p>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stewart-text leading-tight max-w-4xl">
        How a call actually gets processed
      </h2>

      <div className="mt-6 grid lg:grid-cols-12 gap-8 items-start">
        <p className="lg:col-span-8 text-lg text-stewart-muted leading-relaxed">
          From transcript to manager-ready coaching artifacts in one
          Stewart pass. Here&apos;s SESSION 10 &mdash; Jake&apos;s call
          with Larry &mdash; end to end. Click any cherry-pick to see
          Stewart&apos;s read.
        </p>
        <div className="lg:col-span-4">
          <PipelineFlow />
        </div>
      </div>

      <div className="mt-10">
        <CallWalkthrough session10={session10} session18={session18} />
      </div>
    </ScrollSection>
  );
}
