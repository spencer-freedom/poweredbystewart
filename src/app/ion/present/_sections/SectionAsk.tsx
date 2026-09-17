import Link from "next/link";
import { Bridge } from "../_components/Bridge";

// The ask + the close. Pricing mirrors /ion/sow exactly (the page a
// viewer clicks into) — one set of numbers on every surface. Carries the
// shareable #close anchor so /ion/present#close lands on the close.

const PHASES = [
  {
    phase: "Setup",
    title: "Integration + calibration",
    price: "$10,000 one-time",
    bullets: [
      "Five9 and Salesforce connected: every call, every lead, sit and close",
      "Every lead in a bucket from day one — credit DQ, needs the spouse, quote first, fumbled hot — by rule over the read",
      "Calibrated to your script with Kenny and the managers; five on-site days",
      "Live the first Monday every manager opens a brief on the join",
    ],
    emphasis: true,
  },
  {
    phase: "Monthly",
    title: "Stewart, running",
    price: "$9,000 / month",
    bullets: [
      "Every call read; daily briefs and the manager surface for six managers",
      "Lead buckets live, and sit rate by what each set rested on once Salesforce is joined",
      "Weekly call with Kenny, quarterly re-calibration, model spend included",
      "Three months, then month-to-month",
    ],
  },
  {
    phase: "The upgrade",
    title: "Per-rep daily training",
    price: "When the managers ask for it",
    bullets: [
      "Reps open Stewart on their own calls: the gap, the teammate's clip, the word track that works",
      "Closes per 1,000 dials, per rep, on the tape before the tier is bought",
      "Managers first. Once they're believers, the reps follow",
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
