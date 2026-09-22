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
      <SectionHeading letter="A" title="Pilot pricing: sign, then monthly" />

      <p className="text-stewart-muted leading-relaxed">
        Pilot pricing for the first floor. One number to sign, one number a
        month, and two lines that only turn on when the managers ask for
        them. Every line is priced so Ion pays less than one purchased lead a
        day for the whole thing.
      </p>

      <div className="mt-8 space-y-5">
        <PhaseTier
          phase="Signing"
          title="Setup + the first month"
          price="$9,000"
          bullets={[
            "Setup ($3,000): Five9 recordings and Salesforce connected; lead paths wired and every lead in a bucket; accounts for six team managers, Kenny, and the VP at no charge",
            "The baseline: every setter's first 35 calls read before your managers' first Monday — so the first one-on-one starts from a number, not a guess",
            "Calibration with Kenny and the managers: the schema's open questions, what good looks like on the sections the corpus can't decide, the morning list's weights",
            "The first month of service ($6,000), starting at go-live — the Monday the briefs land, or day 45 after signing, whichever comes first",
          ]}
          duration="Pilot pricing for the first floor. Typically live in 3–6 weeks."
        />

        <PhaseTier
          phase="Monthly"
          title="Managers, running"
          price="$6,000 / month"
          bullets={[
            "Base ($3,000): the platform — the floor and GM view, every lead in a bucket, the objection tables, the funnel; every call read, model spend included",
            "Per team manager ($500 × 6): the daily brief, the rep view with train-here and learn-from, objections per rep, the tape one click away",
            "The weekly synthesis call with Kenny; quarterly re-calibration; a grounding standard in writing (98.5% of quoted lines verified against the transcript, checked on every call)",
            "Three months, then month-to-month with 30-day exit",
          ]}
          aside="$3,000 base + $500 per team manager. Managers added or removed as the floor changes."
        />

        <PhaseTier
          phase="Setters"
          title="The rep brief — when the managers ask for it"
          price="$3,000 once + $750 / month per block of 5 setters"
          bullets={[
            "Reps open Stewart on their own calls: where they went wrong, and what to say instead, from what is actually working on this floor",
            "\u201cTrain here\u201d is the rep's gap by section; \u201cLearn from\u201d is the teammate who runs it best, with the clip; the objection table is the word track with a number on it",
            "Closes per 1,000 dials, per rep, against the baseline from the manager phase — the lift is on the tape before this line is bought",
            "Blocks of five, so headcount changes don't become invoice disputes. 35 setters = 7 blocks = $5,250 / month",
          ]}
          aside="The $3,000 covers the rep portal, rep accounts, and the rollout with the managers. Managers first; once they're believers, the reps follow."
        />

        <PhaseTier
          phase="Closers"
          title="The closer script — after the setters"
          price="Priced when the sit channel is known"
          bullets={[
            "Kenny's closer script is stricter than the setter script — the stricter the script, the more of it becomes events and rules",
            "Reads every recorded sit the way it reads every setter call: the script as events, the objections and what worked, the outcome",
            "Depends on how sits are recorded: phone and virtual sits are audio today; in-home sits need a capture path",
            "Its own calibration, priced with the closer count and the channel mix",
          ]}
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
        established. As it runs, the managers will ask &ldquo;can it also
        do this?&rdquo; &mdash; these are the ones we can already see.
        Scoped and priced when asked.
      </p>

      <ul className="mt-6 space-y-3">
        {[
          {
            title: "The lead clock and the write-back",
            body: "Lead in → first contact (and the dials before it) → set → sit → sold, with the time between each and fresh-vs-rehash side by side. Buckets written into Salesforce notes so the follow-up happens where the reps already work. Stewart already sees every state; this is the wiring.",
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
      term: "Three months, then month-to-month.",
      body: "The monthly runs for an initial three months from go-live, then month-to-month with 30-day exit. A customer who has stopped opening the brief isn't a customer, and a long contract would only make that worse for both of us.",
    },
    {
      term: "The meter starts when Stewart is live.",
      body: "Signing covers setup and the first month of service. The first month starts at go-live — the Monday every manager opens a brief with the Salesforce join live — or day 45 after signing, whichever comes first.",
    },
    {
      term: "Pilot pricing.",
      body: "The setup fee is priced for the first floor, because most of the build already exists. It is not the setup fee for the second floor.",
    },
    {
      term: "Data ownership.",
      body: "Your calls, your schema, your wiki — yours. If we part ways, you keep the data structure Stewart built around your floor.",
    },
    {
      term: "Five on-site days in setup, then the weekly call.",
      body: "Spencer's time is written into the setup, not billed by the week. After go-live, the weekly synthesis call with Kenny is where the reads stay Ion's.",
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
          schema Spencer + Kenny build together, plus the trust the critic
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
    "Kenny's red-pen pass on the schema's 22 open TBDs",
    "1 hour with Kenny per week during setup",
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
      {/* Contact path is deliberately "reply to the message this came in" —
          same as the deck's close. Swap for a booking link if one ever exists. */}
      <p className="mt-3 text-stewart-muted leading-relaxed">
        Reply to the message this link came in &mdash; Spencer takes it from
        there, and the first weekly synthesis goes on the calendar.
      </p>
    </section>
  );
}
