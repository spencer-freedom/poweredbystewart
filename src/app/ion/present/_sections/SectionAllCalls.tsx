import Link from "next/link";
import { loadBrainV2 } from "../../(public)/brain/_brain-v2/load";
import { BrainReveal } from "../_components/BrainReveal.client";
import { Bridge } from "../_components/Bridge";

// The scale reveal, right after Imagine. The Miss was three calls picked
// by hand; this is the whole floor. Reads the same payload /ion/brain
// uses; if it isn't on disk, degrade to a link rather than break the
// scroll.

export async function SectionAllCalls() {
  let payload = null;
  try {
    payload = await loadBrainV2();
  } catch {
    payload = null;
  }

  return (
    <section
      id="all-calls"
      className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10 scroll-mt-20"
    >
      <div className="max-w-5xl w-full">
        <Bridge>
          Those were three calls, picked by hand. Stewart doesn&apos;t pick
          by hand.
        </Bridge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          Stewart read all {payload?.stats.calls_total ?? 300}.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-stewart-muted leading-relaxed">
          Every call your floor gave us. Your playbook is the core. Each call
          orbits it. Every coachable moment is an ion around the call it came
          from.
        </p>

        <div className="mt-10">
          {payload ? (
            <BrainReveal payload={payload} />
          ) : (
            <Link
              href="/ion/brain"
              className="group block rounded-xl border border-stewart-accent/40 bg-stewart-accent/5 p-6 hover:bg-stewart-accent/10 transition-colors max-w-xl"
            >
              <p className="text-lg font-semibold text-stewart-text">
                Open Stewart&apos;s brain on your calls{" "}
                <span className="text-stewart-accent group-hover:translate-x-1 inline-block transition-transform">
                  &rarr;
                </span>
              </p>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
