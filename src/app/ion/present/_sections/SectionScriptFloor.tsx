import Link from "next/link";
import { Bridge } from "../_components/Bridge";
import { SCRIPT_SECTIONS, loadCorpusStats } from "../_lib/corpus";
import { ScriptFunnel } from "../_components/ScriptFunnel.client";

// The floor against its own script — measured, not asserted. Every number
// here is a count over the published corpus (public/ion/corpus-stats.json):
// per section, did the rep run it; and the two anchors the whole pitch is
// built on — was the bill used, was the reason used.

export async function SectionScriptFloor() {
  const s = await loadCorpusStats();
  if (!s) return null;
  const rows = SCRIPT_SECTIONS.map((sec) => {
    const c = s.script_coverage[sec.key] ?? { asked: 0, skipped: 0, not_reached: 0, asked_rate: 0 };
    const reached = c.asked + c.skipped;
    return { ...sec, ...c, reached, rate_of_reached: reached ? c.asked / reached : 0 };
  });
  const b = s.bill;
  const r = s.interest_reason;
  const ra = s.adherence_vs_outcome?.anchors.reason_asked;
  const rn = s.adherence_vs_outcome?.anchors.reason_not_asked;
  const askedLine =
    ra && rn && ra.set_rate !== null && rn.set_rate !== null
      ? `Calls where it was asked set at ${Math.round(ra.set_rate * 100)}%; calls where it wasn't, ${Math.round(rn.set_rate * 100)}%.`
      : null;

  return (
    <section
      id="floor"
      className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10 scroll-mt-20"
    >
      <div className="max-w-4xl w-full">
        <Bridge>
          Here&apos;s what all {s.calls} look like against the script your floor
          runs. Nobody told Stewart what to find &mdash; these are counts.
        </Bridge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          Your script, across the floor.
        </h2>

        {/* The two anchors */}
        <div className="mt-10 grid sm:grid-cols-2 gap-5">
          <Anchor
            kicker="The bill"
            big={`${b.flipped} of ${b.captured}`}
            line={`Reps got the bill on ${b.captured} calls. They used it as the reason to act on ${b.flipped}.`}
            sub={`${b.not_flipped} times the number was captured and filed. ${b.no_bill_captured} calls never got a bill at all.`}
          />
          <Anchor
            kicker="The reason"
            big={`${r.used} of ${r.reason_given}`}
            line={`“What has you interested in solar?” was asked on ${r.asked} of ${s.calls} calls. ${r.reason_given} customers gave a reason. It was used ${r.used} times.`}
            sub={`${r.not_asked} calls never asked — it's the first question on the script.${askedLine ? " " + askedLine : ""}`}
          />
        </div>

        {/* The script as a funnel — wide at the intro, narrowing where calls end. */}
        <div className="mt-12">
          <ScriptFunnel
            title="Your script, as a funnel"
            floor={{
              calls: s.calls,
              sections: Object.fromEntries(rows.map((r) => [r.key, { asked: r.asked, skipped: r.skipped, not_reached: r.not_reached }])),
              on_line: s.funnel ? Object.fromEntries(Object.entries(s.funnel.floor.sections).map(([k, v]) => [k, v.on_line])) : undefined,
            }}
          />
          <p className="mt-4 text-xs text-stewart-muted">
            &ldquo;Ran it&rdquo; means any phrasing, not the script&apos;s words. A call that disqualified at the
            roof never got to button-up, so it doesn&apos;t count against it. Hover a row for the counts.
            &ldquo;Set&rdquo; is Stewart&apos;s read of the call &mdash; booked or tentative &mdash; until your sits
            and closes are joined. The same funnel exists for every rep.
          </p>
        </div>

        <p className="mt-10 text-lg text-stewart-text leading-relaxed max-w-3xl">
          This is a floor-wide gap, not a rep problem &mdash; and it&apos;s a question your
          script already asks.{" "}
          <span className="text-stewart-muted">
            Every number here is also a per-rep number.{" "}
            <Link href="/ion/manager" className="text-stewart-accent hover:underline">
              See the floor by rep &rarr;
            </Link>
          </span>
        </p>
      </div>
    </section>
  );
}

function Anchor({ kicker, big, line, sub }: { kicker: string; big: string; line: string; sub: string }) {
  return (
    <div className="rounded-xl border border-stewart-accent/40 bg-stewart-accent/5 p-5 sm:p-6">
      <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-stewart-accent">{kicker}</p>
      <p className="mt-2 font-mono text-4xl sm:text-5xl font-bold text-stewart-warning leading-none">{big}</p>
      <p className="mt-3 text-base text-stewart-text leading-relaxed">{line}</p>
      <p className="mt-1.5 text-sm text-stewart-muted leading-relaxed">{sub}</p>
    </div>
  );
}
