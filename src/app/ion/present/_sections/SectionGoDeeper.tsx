import Link from "next/link";

// The appendix. A viewer who wants to check the work can — every deep
// surface is one click away, and none of them were required to get here.

const DEEPER = [
  {
    href: "/ion/brain",
    title: "The brain",
    body: "All 332 calls in orbit around your playbook. Click any call to open Stewart's full read.",
  },
  {
    href: "/ion/calls",
    title: "Every call",
    body: "Search by rep, objection, or pattern. Manager brief, moments, handoff, and the audit on each.",
  },
  {
    href: "/ion/schema",
    title: "Your playbook",
    body: "The schema Stewart reads against — your script, your protocols, your coaching philosophy. With what's still TBD.",
  },
  {
    href: "/ion/present/script",
    title: "Your script",
    body: "The setting script your floor runs, verbatim, with the lines this walkthrough pulled from tagged back to the clips.",
  },
  {
    href: "/ion/sow",
    title: "Scope of work",
    body: "Phases, pricing, terms, and what Spencer will and won't do.",
  },
];

export function SectionGoDeeper() {
  return (
    <section
      id="deeper"
      className="relative bg-black flex items-center justify-center px-6 py-24 scroll-mt-20"
    >
      <div className="max-w-4xl w-full">
        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent mb-4">
          If you want to check the work
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-stewart-text leading-tight">
          Everything above is one click deeper.
        </h2>

        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {DEEPER.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="group rounded-xl border border-stewart-border bg-stewart-card p-5 hover:border-stewart-accent/50 transition-colors"
            >
              <p className="flex items-baseline justify-between gap-3">
                <span className="text-lg font-bold text-stewart-text">{d.title}</span>
                <span className="text-stewart-accent group-hover:translate-x-1 inline-block transition-transform">
                  &rarr;
                </span>
              </p>
              <p className="mt-2 text-sm text-stewart-muted leading-relaxed">{d.body}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
