import Link from "next/link";
import { SectionFrame } from "../_components/SectionFrame";
import { loadBrainV2 } from "../../(public)/brain/_brain-v2/load";
import { BrainPageShell } from "../../(public)/brain/_brain-v2/BrainPageShell.client";

// Build #3 — the Brain, embedded inline (~1:00 on screen). Renders the
// existing V1 brain renderer directly (no iframe, no chrome) by loading
// the same payload the /ion/brain page uses. If the payload isn't present
// (e.g. before the build pipeline has written it), degrade to a link out
// rather than crash the whole pitch scroll. Time-as-distance + state-ion
// overlay are the deferred V2 enhancement.

export async function SectionBrain() {
  let payload = null;
  try {
    payload = await loadBrainV2();
  } catch {
    payload = null;
  }

  return (
    <SectionFrame
      id="brain"
      index={3}
      eyebrow="The Brain"
      title="Every call your floor makes flows into one structure."
      question="Can it actually understand?"
      highlight="Remember"
    >
      <p className="text-base text-stewart-muted leading-relaxed max-w-3xl mb-8">
        The crystal core is your schema &mdash; your scripts, protocols,
        coaching philosophy. Each processed call orbits it, colored by the
        schema sections it touched. What to look for: the calls cluster
        around the parts of your playbook they actually used &mdash; and the
        gaps show where they didn&apos;t.
      </p>

      {payload ? (
        <div className="rounded-xl border border-stewart-border bg-stewart-card p-4 sm:p-6">
          <BrainPageShell payload={payload} />
        </div>
      ) : (
        <Link
          href="/ion/brain"
          className="group block rounded-xl border border-stewart-accent/40 bg-stewart-accent/5 p-6 hover:bg-stewart-accent/10 transition-colors max-w-xl"
        >
          <p className="text-lg font-semibold text-stewart-text">
            Open Stewart&apos;s brain on your 332 calls{" "}
            <span className="text-stewart-accent group-hover:translate-x-1 inline-block transition-transform">
              &rarr;
            </span>
          </p>
          <p className="mt-2 text-sm text-stewart-muted">
            Live 3D render — schema core, call orbits, cherry-pick moments.
          </p>
        </Link>
      )}
    </SectionFrame>
  );
}
