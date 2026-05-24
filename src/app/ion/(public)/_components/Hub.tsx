import Link from "next/link";

// Public landing hub for the Ion surface. The three production-ready
// pieces (brain, calls, schema) live behind one-line cards here.
// /ion and /ion/whats-next both render this — the scroll demo + Scope
// of Work are still being polished and live at /ion/demo and /ion/sow
// respectively (unlinked from this hub on purpose).

type Card = {
  href: string;
  title: string;
  tagline: string;
  body: string;
};

const CARDS: Card[] = [
  {
    href: "/ion/brain",
    title: "Stewart's brain",
    tagline: "Atomic structure of your sales floor",
    body: "Crystal-core schema at the center. Each of your 332 processed calls orbits as a walnut nucleus. Cherry-pick moments orbit each call as ions colored by the schema domain they touched. Gray-matter exemplars stay near their schema section.",
  },
  {
    href: "/ion/calls",
    title: "Every call we processed",
    tagline: "Browse all 332 — search, filter, drill down",
    body: "Search by call_id / rep / objection / schema reference. Filter by outcome, rep, pattern, or tier (hero / gray-matter / standard). Click any call to open Stewart's full coaching folder: manager brief, cherry-picks, handoff brief, critic audit.",
  },
  {
    href: "/ion/schema",
    title: "Your floor's textbook",
    tagline: "The schema — browseable, with what's TBD vs RESOLVED",
    body: "1,173 lines. 101 sections actively lit by Stewart's reads. 14 TBDs Spencer + Kenny work through together. 8 new categories pending Kenny's approval — including the bombshell.",
  },
];

export function Hub() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
          Stewart on Ion Solar
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-accent leading-tight">
          The Brain, the Calls, the Schema
        </h1>
        <p className="mt-4 text-sm text-stewart-text leading-relaxed">
          Pick where to start. Each surface is the same underlying
          corpus &mdash; the brain is the visual, the calls page is the
          tabular browse, the schema is your floor&apos;s textbook.
        </p>
      </header>

      <div className="grid gap-5">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group block rounded-lg border border-stewart-border bg-stewart-card hover:border-stewart-accent/50 hover:bg-stewart-bg/40 transition-colors p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
              <h2 className="text-xl sm:text-2xl font-bold text-stewart-text">
                {card.title}
              </h2>
              <span className="text-sm font-mono text-stewart-accent group-hover:translate-x-1 inline-block transition-transform">
                {card.href} &rarr;
              </span>
            </div>
            <p className="text-sm sm:text-base text-stewart-accent font-medium mb-3">
              {card.tagline}
            </p>
            <p className="text-sm sm:text-base text-stewart-muted leading-relaxed">
              {card.body}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
