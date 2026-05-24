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

// Server component. Loads all 7 hero-call bundles from public/ion/
// and ships them to the interactive carousel. Default-selected call is
// SESSION10 (the chum-the-fish call Kenny already saw).
//
// The 8 JSON files for each call live at public/ion/{slug}-*.json
// where slug = call_id.lower(). Build script:
// scripts/build_ion_demo_assets.py regenerates them from the canonical
// data in SpencerOS/data/ion_solar/calls/.

type HeroSpec = {
  callId: string;
  slug: string;
  tagline: string;
  grayMatterSection: string | null;
  hasHandoff: boolean;
};

const HERO_SPECS: HeroSpec[] = [
  {
    callId: "SESSION10_eb080f7c",
    slug: "session10_eb080f7c",
    tagline: "Larry was qualified. Jake lost him.",
    grayMatterSection: null,
    hasHandoff: false,
  },
  {
    callId: "SESSION18_fd078269",
    slug: "session18_fd078269",
    tagline: "Spouse-protocol fast-book.",
    grayMatterSection: "protocols.spouse_decision",
    hasHandoff: true,
  },
  {
    callId: "SESSION18_fcbf33c1",
    slug: "session18_fcbf33c1",
    tagline: "Roof cross-sell bridge in 4 seconds.",
    grayMatterSection: "cross_sell_signals.roof_replacement_planned",
    hasHandoff: true,
  },
  {
    callId: "SESSION14_be5b61f0",
    slug: "session14_be5b61f0",
    tagline: "Masterclass. Multi-angle resilience + bill anchor.",
    grayMatterSection: "coaching_philosophy.bill_anchoring",
    hasHandoff: true,
  },
  {
    callId: "SESSION20_2b61f758",
    slug: "session20_2b61f758",
    tagline: "Fragile win. Hostile → committed-with-conditions.",
    grayMatterSection: null,
    hasHandoff: true,
  },
  {
    callId: "SESSION6_72cebf8e",
    slug: "session6_72cebf8e",
    tagline: "Vulnerable customer. Empathy gap.",
    grayMatterSection: null,
    hasHandoff: false,
  },
  {
    callId: "SESSION8_e0938fef",
    slug: "session8_e0938fef",
    tagline: "Credit threshold near-miss.",
    grayMatterSection: null,
    hasHandoff: false,
  },
];

async function loadJson<T>(filename: string): Promise<T> {
  const filePath = path.join(process.cwd(), "public", "ion", filename);
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function loadBundle(spec: HeroSpec): Promise<CallBundle> {
  const [managerBrief, cherryPicks, metadata] = await Promise.all([
    loadJson<ManagerBrief>(`${spec.slug}-manager-brief.json`),
    loadJson<CherryPick[]>(`${spec.slug}-cherrypicks.json`),
    loadJson<Metadata>(`${spec.slug}-metadata.json`),
  ]);
  const handoff = spec.hasHandoff
    ? await loadJson<Handoff>(`${spec.slug}-handoff.json`)
    : undefined;
  return {
    metadata,
    managerBrief,
    cherryPicks,
    handoff,
    tagline: spec.tagline,
    grayMatterSection: spec.grayMatterSection,
  };
}

export async function Section2CallWalkthrough() {
  const bundles = await Promise.all(HERO_SPECS.map(loadBundle));

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
          Stewart pass. Seven calls Spencer hand-picked from the 332
          processed for the demo &mdash; pick any to walk through it
          end to end.
        </p>
        <div className="lg:col-span-4">
          <PipelineFlow />
        </div>
      </div>

      <div className="mt-10">
        <CallWalkthrough bundles={bundles} />
      </div>
    </ScrollSection>
  );
}
