import Link from "next/link";
import { Bridge } from "../_components/Bridge";

// The ask + the close. Pricing mirrors /ion/sow exactly (the page a
// viewer clicks into) — one set of numbers on every surface. Carries the
// shareable #close anchor so /ion/present#close lands on the close.

const PHASES = [
  {
    phase: "Phase 1",
    title: "Build retainer — calls + leads",
    price: "$2,000 / week",
    bullets: [
      "Every call read — the script, the bill, the objections, the outcome — and the daily briefs",
      "The money and the result follow the lead, not just the call — what each set rested on, then sit and close per lead once Salesforce is joined",
      "Leads sorted into buckets by rule — no credit goes to the bucket, not to a rep",
      "Spencer in the building 1–1.5 days a week, 12–26 weeks; your playbook, written with Kenny",
      "Calls only, no lead tracking: $1,500 / week",
    ],
    emphasis: true,
  },
  {
    phase: "Phase 2",
    title: "Per-manager subscription",
    price: "$1,500 / manager / month",
    bullets: [
      "Once managers can run a one-on-one with zero prep",
      "Daily briefs, searchable manager wiki, per-rep trends",
      "All six managers: $9,000 / month",
    ],
  },
  {
    phase: "Phase 3",
    title: "Per-rep add-on",
    price: "$125 / rep / month",
    bullets: [
      "Reps open Stewart after their own calls",
      "Daily training brief calibrated to each rep's gaps",
      "Stacks on Phase 2 — when managers trust it",
    ],
  },
];

export function SectionAsk() {
  return (
    <section
      id="ask"
      className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10 scroll-mt-20"
    >
      <div className="max-w-4xl w-full">
        <Bridge>Here&apos;s what it takes.</Bridge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          What it takes to make Stewart yours.
        </h2>

        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {PHASES.map((p) => (
            <div
              key={p.phase}
              className={
                "rounded-xl border p-5 " +
                (p.emphasis
                  ? "border-stewart-accent/50 bg-stewart-accent/5"
                  : "border-stewart-border bg-stewart-card")
              }
            >
              <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent">
                {p.phase}
              </p>
              <h3 className="mt-1 text-lg font-bold text-stewart-text">{p.title}</h3>
              <p className="mt-1 font-mono text-sm text-stewart-muted">{p.price}</p>
              <ul className="mt-4 space-y-2">
                {p.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-stewart-text leading-snug">
                    <span className="text-stewart-accent shrink-0">&bull;</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-5">
          <Link href="/ion/sow" className="text-sm text-stewart-accent hover:underline">
            Full scope of work, pricing &amp; terms &rarr;
          </Link>
        </p>

        <blockquote className="mt-12 max-w-3xl border-l-2 border-stewart-accent pl-5 text-lg sm:text-xl text-stewart-text leading-snug italic">
          &ldquo;I won&apos;t do this without being in the building. The
          playbook is what makes Stewart yours. Buy it without me in the
          building and you bought a wrapper &mdash; and I won&apos;t put my
          name on that.&rdquo;
        </blockquote>

        {/* The close — shareable anchor */}
        <div id="close" className="scroll-mt-24 mt-20 pt-12 border-t border-white/10">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent mb-6">
            The close
          </p>
          <div className="max-w-3xl space-y-8">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stewart-text leading-tight">
              I don&apos;t think Ion has a lead problem. I think Ion has an
              opportunity-visibility problem. I believe Stewart solves that.
            </p>
            <p className="text-xl sm:text-2xl text-stewart-muted leading-snug">
              I built this cup of water. If you want it, let&apos;s partner
              and build something great together &mdash; for both of us.
            </p>
            <p className="pt-2 text-base text-stewart-muted">
              &mdash; Spencer
            </p>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-4">
            <Link
              href="/ion/sow"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-stewart-accent px-6 py-3 text-base font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Read the scope of work
              <span aria-hidden>&rarr;</span>
            </Link>
            <p className="text-sm text-stewart-muted">
              Then reply to the message this came in &mdash; Spencer takes it
              from there.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
