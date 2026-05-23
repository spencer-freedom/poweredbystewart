import Link from "next/link";

export const dynamic = "force-dynamic";

export default function WhatsNextPage() {
  return (
    <article className="max-w-4xl mx-auto space-y-14 print:space-y-10 print:text-black">
      <header>
        <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
          Scope of work
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          Working with Spencer + Stewart on Ion Solar
        </h1>
        <p className="mt-3 text-lg italic text-stewart-muted">
          Scope of work. Pricing. Engagement terms.
        </p>
      </header>

      <SectionA />
      <SectionB />
      <SectionC />
      <SectionD />
      <SectionE />

      <FooterCta />

      <div className="pt-6 border-t border-stewart-border">
        <Link
          href="/ion"
          className="text-sm text-stewart-muted hover:text-stewart-text transition-colors"
        >
          &larr; Back to the demo
        </Link>
      </div>
    </article>
  );
}

function SectionHeading({
  letter,
  title,
}: {
  letter: string;
  title: string;
}) {
  return (
    <div className="flex items-baseline gap-3 mb-5">
      <span className="text-xs font-mono text-stewart-accent border border-stewart-accent/40 rounded px-2 py-1 shrink-0">
        SECTION {letter}
      </span>
      <h2 className="text-xl sm:text-2xl font-bold text-stewart-text leading-tight">
        {title}
      </h2>
    </div>
  );
}

function SectionA() {
  return (
    <section>
      <SectionHeading letter="A" title="The three-phase pricing ladder" />

      <p className="text-stewart-muted leading-relaxed">
        Stewart&apos;s pricing maps to the value Stewart delivers. You pay
        weekly while Spencer is embedded and the value is build effort.
        You pay per-manager once the system is trusted and replacing prep
        time. You pay per-rep once Stewart is going rep-facing for
        self-coaching.
      </p>

      <div className="mt-8 space-y-5">
        <PhaseTier
          phase="Phase 1"
          title="Build retainer"
          price="$1,500 / week"
          bullets={[
            "Spencer in the building 1–1.5 days per week",
            "Stewart pipeline processing your calls in real time",
            "Daily manager briefs as Stewart's reads stabilize",
            "Codex iteration with Kenny — TBD-fill, gray-matter exemplar validation",
            "Weekly synthesis call with Kenny + leadership",
          ]}
          cutoff="when managers can sit down with any rep, pull up Stewart, and run a 1-on-1 with zero prep. Same standard for daily 4-call team trainings."
          duration="12–26 weeks depending on codex velocity."
        />

        <PhaseTier
          phase="Phase 2"
          title="Per-team-manager subscription"
          price="$1,500 / manager / month"
          bullets={[
            "Stewart access for each team manager, with all their team's reps grouped under their subscription",
            "Daily 90-second manager briefs continue",
            "Manager-facing wiki: search any rep, any codex section, any pattern",
            "Per-rep aggregates and trend reporting",
            "Ongoing schema refinement (Kenny + Spencer light-touch)",
          ]}
          aside="Ion at full coverage (6 managers): $9,000 / month = $108,000 / year"
        />

        <PhaseTier
          phase="Phase 3"
          title="Per-rep tier (stacks on Phase 2)"
          price="$125 / rep / month"
          bullets={[
            "Reps can open Stewart after their own calls for self-coaching",
            "Per-rep daily training brief calibrated to that rep's gaps + their pay-tier position",
            "Available once managers have crossed the trust threshold and the rep-facing rollout is scoped",
          ]}
          aside="Ion at full rollout (35 reps): $9,000 + $4,375 = $13,375 / month = $160,500 / year"
        />
      </div>
    </section>
  );
}

function PhaseTier({
  phase,
  title,
  price,
  bullets,
  cutoff,
  duration,
  aside,
}: {
  phase: string;
  title: string;
  price: string;
  bullets: string[];
  cutoff?: string;
  duration?: string;
  aside?: string;
}) {
  return (
    <div className="rounded-lg border border-stewart-border bg-stewart-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4 pb-4 border-b border-stewart-border">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-xs font-mono uppercase tracking-wider text-stewart-accent">
            {phase}
          </span>
          <h3 className="text-lg sm:text-xl font-semibold text-stewart-text">
            {title}
          </h3>
        </div>
        <p className="text-lg font-bold text-stewart-accent font-mono">
          {price}
        </p>
      </div>

      <ul className="space-y-2 text-sm sm:text-base text-stewart-text leading-relaxed">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-stewart-accent mt-1 shrink-0">&bull;</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {cutoff ? (
        <p className="mt-4 text-sm text-stewart-muted leading-relaxed">
          <span className="uppercase tracking-wider text-stewart-warning text-xs font-semibold">
            Cutoff trigger:
          </span>{" "}
          {cutoff}
        </p>
      ) : null}

      {duration ? (
        <p className="mt-2 text-xs italic text-stewart-muted">
          Estimated duration: {duration}
        </p>
      ) : null}

      {aside ? (
        <p className="mt-4 text-xs italic text-stewart-muted font-mono">
          {aside}
        </p>
      ) : null}
    </div>
  );
}

function SectionB() {
  return (
    <section>
      <SectionHeading
        letter="B"
        title="Available expansion (not in base scope)"
      />
      <p className="text-stewart-muted leading-relaxed">
        These deepen the value of the engagement after Stewart is
        established. We&apos;d scope them with you in months 2&ndash;3
        once you&apos;ve seen Stewart in production.
      </p>

      <ul className="mt-6 space-y-3">
        {[
          {
            title: "Five9 + Salesforce + lead-source full API integration",
            body: "Stewart pulls calls and outcomes directly, no manual upload.",
          },
          {
            title: "Historical 6-month backfill with revenue attribution",
            body: "Stewart processes your full prior corpus and tells you 'you would have recovered $X in the last 6 months if Stewart had been catching these patterns.'",
          },
          {
            title: "Analytics dashboard for sales leadership",
            body: "VP-facing view tying coaching activity to revenue outcomes. Pattern-level ROI, per-rep contribution attribution.",
          },
          {
            title: "New-hire onboarding program",
            body: "Stewart-driven training integrated with Ion's lead-level progression.",
          },
        ].map((item) => (
          <li
            key={item.title}
            className="rounded-lg border border-stewart-border bg-stewart-card p-5"
          >
            <p className="font-semibold text-stewart-text">{item.title}</p>
            <p className="text-sm text-stewart-muted mt-2 leading-relaxed">
              {item.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SectionC() {
  const TERMS = [
    {
      term: "No long-term contract.",
      body: "Phase 1 is month-to-month. Phases 2–3 are quarterly with 30-day exit.",
    },
    {
      term: "Hard cutoff triggers, not arbitrary contracts.",
      body: "Spencer steps off the weekly retainer when managers can run zero-prep coaching. Not before. Not later.",
    },
    {
      term: "Data ownership.",
      body: "Your calls, your codex, your wiki — yours. If we part ways, you keep the data structure Stewart built around your floor.",
    },
    {
      term: "Spencer time discipline.",
      body: "1–1.5 days per week on-site during build, NO MORE. Spencer's other commitments (UsefulWax + BDC-in-a-Box) are real. Time-bounded engagement protects the work quality.",
    },
  ];

  return (
    <section>
      <SectionHeading letter="C" title="Engagement terms" />
      <ul className="space-y-4">
        {TERMS.map((t) => (
          <li key={t.term} className="flex gap-4">
            <span className="text-stewart-accent mt-1.5 shrink-0">&#9656;</span>
            <p className="text-stewart-text leading-relaxed">
              <strong>{t.term}</strong>{" "}
              <span className="text-stewart-muted">{t.body}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SectionD() {
  return (
    <section>
      <SectionHeading letter="D" title="Why this pricing structure" />
      <div className="space-y-4 text-stewart-muted leading-relaxed">
        <p>
          Pure software SaaS lives at 80&ndash;95% gross margins.
          LLM-powered analytical SaaS done badly drops to 40&ndash;60%.
          Stewart&apos;s architecture (two-pass pipeline with cheap
          classifier + selective deep-pass + cross-vendor critic) lives
          at <strong className="text-stewart-text">~85% gross margin</strong>{" "}
          at the per-manager tier &mdash; better than Gong&apos;s
          reported margins.
        </p>
        <p>
          You&apos;re not paying for compute. You&apos;re paying for the
          codex Spencer + Kenny build together, plus the trust the critic
          produces. The compute is the cheap part.
        </p>
      </div>
    </section>
  );
}

function SectionE() {
  const NEEDS = [
    "Five9 API access (gated on contract signature — we operate on prior export until then)",
    "The four conversion numbers (sets/month, sit%, close%, avg gross per sale) — for honest ROI math",
    "Kenny's red-pen pass on the codex's 22 open TBDs",
    "1 hour with Kenny per week during build phase",
  ];

  return (
    <section>
      <SectionHeading letter="E" title="What we need from Ion" />
      <p className="text-stewart-muted leading-relaxed mb-4">
        For build to start:
      </p>
      <ul className="space-y-2">
        {NEEDS.map((n) => (
          <li key={n} className="flex gap-3 text-stewart-text leading-relaxed">
            <span className="text-stewart-accent mt-1 shrink-0">&bull;</span>
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FooterCta() {
  return (
    <section className="rounded-2xl border border-stewart-accent/40 bg-gradient-to-br from-stewart-accent/10 via-stewart-card to-stewart-bg p-8 sm:p-10">
      <p className="text-xl sm:text-2xl font-semibold text-stewart-text leading-snug">
        Ready to start?
      </p>
      {/*
        Contact path TBD — Spencer to decide whether this hooks to a
        Cal.com booking link, a form, an email, or a "reply to this
        thread" CTA. Until then we render a styled placeholder so the
        page has a clear close.
      */}
      <p className="mt-3 text-stewart-muted leading-relaxed">
        <span className="text-stewart-warning">
          [TODO &middot; Spencer&apos;s contact / form / book a call]
        </span>{" "}
        &mdash; reach out and we&apos;ll get the first weekly synthesis
        on the calendar.
      </p>
    </section>
  );
}
