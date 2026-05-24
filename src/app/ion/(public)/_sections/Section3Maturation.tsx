import { ScrollSection } from "./ScrollSection";
import { MaturationTimeline } from "../_visuals";

type Phase = {
  n: number;
  title: string;
  pricing: string;
  body: string[];
  exitTrigger?: string;
  meta?: string;
};

const PHASES: Phase[] = [
  {
    n: 1,
    title: "Embedded build",
    pricing: "Weekly build retainer",
    meta: "weeks 1–12",
    body: [
      "Spencer is in the building 1–1.5 days per week. Kenny's TBDs get filled. Gray-matter exemplars get tagged. Stewart's reads get sharper week over week.",
      "Stewart processes your calls in real time. Manager briefs land daily. Quality improves with every schema refinement.",
    ],
    exitTrigger: "the manager-trust threshold (see Phase 2)",
  },
  {
    n: 2,
    title: "Manager-trust threshold crossed",
    pricing: "Per-team-manager subscription",
    body: [
      "Hard cutoff for Phase 1: managers can sit down for a 1-on-1 with any rep, pull up Stewart, and run the coaching with zero prep. Same standard for daily 4-call team trainings.",
      "This is an operator criterion, not a usage metric. You'll feel it when it lands.",
      "Stewart is no longer in active build. The schema is mature. Spencer steps off the weekly retainer.",
    ],
  },
  {
    n: 3,
    title: "Per-rep training, the Ion way",
    pricing: "Per-rep add-on (stacks on Phase 2 subscription)",
    body: [
      "Stewart now generates per-rep daily training calibrated to each rep's specific gaps + where they are in their pay-tier stair-step.",
      "Coaching isn't one-size-fits-all — Marcus needs spouse-protocol drills, Holland needs softener discipline, Parker needs scope-creep awareness.",
    ],
  },
  {
    n: 4,
    title: "Rep-facing tier",
    pricing: "Included in Phase 3 once stable",
    body: [
      "Reps open Stewart after their own calls for self-coaching. Same trust standard as managers had to earn — Stewart's reads are sharp enough that reps trust the read on themselves.",
      "This is the trust threshold that most AI sales tools never cross.",
    ],
  },
  {
    n: 5,
    title: "New-hire onboarding integration",
    pricing: "Scoped separately, post V1 + V2",
    body: [
      "Built into Ion's existing lead-level progression (old rehashed leads → set X appointments → move up tiers → eventually earn fresh paid leads).",
      "New hires learn from your top performers' actual calls, not from generic theory.",
    ],
  },
  {
    n: 6,
    title: "Ongoing platform",
    pricing: "Stewart evolves with Ion",
    body: [
      "As Ion's scripts, products, and market evolve, Stewart evolves with them. The schema becomes a living document of Ion's actual sales philosophy — Kenny's brain made queryable.",
      "A year in, Stewart's reads are sharper than they were on day 1. Two years in, sharper still. This is the compound interest of the engagement.",
    ],
  },
];

export function Section3Maturation() {
  return (
    <ScrollSection id="maturation">
      <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
        The trajectory
      </p>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stewart-text leading-tight max-w-4xl">
        Stewart isn&apos;t a tool you install once. It&apos;s a capability
        that deepens.
      </h2>

      <p className="mt-6 text-lg text-stewart-muted leading-relaxed max-w-3xl">
        Each phase unlocks the next. You only pay for what&apos;s working
        &mdash; and the value compounds as Stewart learns your floor.
      </p>

      <div className="mt-12">
        <MaturationTimeline />
      </div>

      <ol className="mt-8 space-y-4">
        {PHASES.map((phase) => (
          <PhaseCard key={phase.n} phase={phase} />
        ))}
      </ol>

      <p className="mt-12 text-xl sm:text-2xl text-stewart-text font-medium leading-snug max-w-3xl">
        You&apos;re not locked in. Phase 1 is month-to-month. The hard
        cutoffs are operator criteria, not contracts. If Stewart
        isn&apos;t delivering, you walk. We&apos;re betting it will.
      </p>
    </ScrollSection>
  );
}

function PhaseCard({ phase }: { phase: Phase }) {
  return (
    <li className="rounded-lg border border-stewart-border bg-stewart-card p-6 list-none">
      <div className="flex flex-wrap items-baseline gap-3 mb-4">
        <span className="text-xs font-mono text-stewart-accent border border-stewart-accent/40 rounded px-2 py-1">
          PHASE {phase.n}
        </span>
        <h3 className="text-lg sm:text-xl font-semibold text-stewart-text">
          {phase.title}
        </h3>
        {phase.meta ? (
          <span className="text-xs text-stewart-muted">{phase.meta}</span>
        ) : null}
      </div>

      <p className="text-xs uppercase tracking-wider text-stewart-muted mb-3">
        <span className="text-stewart-accent">Pricing tier:</span>{" "}
        {phase.pricing}
      </p>

      <div className="space-y-3 text-sm text-stewart-text leading-relaxed">
        {phase.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {phase.exitTrigger ? (
        <p className="mt-4 text-xs text-stewart-muted">
          <span className="uppercase tracking-wider text-stewart-warning">
            Exit trigger:
          </span>{" "}
          {phase.exitTrigger}
        </p>
      ) : null}
    </li>
  );
}
