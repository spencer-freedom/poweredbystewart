// Horizontal 6-phase maturation timeline. Renders on lg+ as visual
// chrome above the existing phase-card list in Section3Maturation; on
// smaller viewports the timeline hides and the cards carry the story.
//
// Pure SVG-ish (CSS + flex) — no external libs. Animations are
// CSS-only and respect prefers-reduced-motion via the media query
// baked into Tailwind's motion-safe variant.

type Phase = {
  num: number;
  label: string;
  price: string;
  tier: "build" | "subscription" | "later";
};

const PHASES: Phase[] = [
  { num: 1, label: "Build retainer", price: "$1,500 / wk", tier: "build" },
  {
    num: 2,
    label: "Manager-trust crossed",
    price: "$1,500 / mgr / mo",
    tier: "subscription",
  },
  {
    num: 3,
    label: "Per-rep training",
    price: "+$125 / rep / mo",
    tier: "subscription",
  },
  {
    num: 4,
    label: "Rep-facing tier",
    price: "in Phase 3 once stable",
    tier: "subscription",
  },
  { num: 5, label: "Onboarding integration", price: "scoped later", tier: "later" },
  { num: 6, label: "Ongoing platform", price: "evolves with Ion", tier: "later" },
];

const TIER_TONE: Record<
  Phase["tier"],
  { circle: string; ring: string; label: string }
> = {
  build: {
    circle: "bg-stewart-warning text-stewart-bg",
    ring: "ring-stewart-warning/40",
    label: "text-stewart-warning",
  },
  subscription: {
    circle: "bg-stewart-success text-stewart-bg",
    ring: "ring-stewart-success/40",
    label: "text-stewart-success",
  },
  later: {
    circle: "bg-stewart-muted text-stewart-bg",
    ring: "ring-stewart-muted/40",
    label: "text-stewart-muted",
  },
};

export function MaturationTimeline() {
  return (
    <div className="hidden lg:block" aria-hidden>
      <div className="relative pt-8 pb-12">
        {/* Connecting line */}
        <div
          className="absolute left-8 right-8 top-[4.5rem] h-px bg-gradient-to-r from-stewart-warning via-stewart-success to-stewart-muted/40"
          aria-hidden
        />
        {/* Phases */}
        <ol className="relative grid grid-cols-6 gap-2">
          {PHASES.map((phase) => (
            <PhaseNode key={phase.num} phase={phase} />
          ))}
        </ol>

        {/* Cutoff markers — placed at the gaps between phases */}
        <div className="relative mt-3 grid grid-cols-6 text-[10px] uppercase tracking-wider text-stewart-muted">
          <div className="col-start-1 col-end-3 text-center">
            <CutoffMarker label="Cutoff: managers run zero-prep coaching" />
          </div>
          <div className="col-start-3 col-end-5 text-center">
            <CutoffMarker label="Cutoff: rep-facing rollout scoped" />
          </div>
        </div>

        {/* Tier band underneath */}
        <div className="relative mt-6 grid grid-cols-6 gap-2">
          <div className="col-span-1 rounded-md border border-stewart-warning/30 bg-stewart-warning/5 px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-stewart-warning">
              Paid weekly
            </p>
            <p className="text-[10px] text-stewart-muted mt-0.5">
              while Spencer is embedded
            </p>
          </div>
          <div className="col-span-3 rounded-md border border-stewart-success/30 bg-stewart-success/5 px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-stewart-success">
              Subscription
            </p>
            <p className="text-[10px] text-stewart-muted mt-0.5">
              per manager · per rep
            </p>
          </div>
          <div className="col-span-2 rounded-md border border-stewart-border bg-stewart-card px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-stewart-muted">
              Scoped later
            </p>
            <p className="text-[10px] text-stewart-muted/80 mt-0.5">
              expansion + ongoing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhaseNode({ phase }: { phase: Phase }) {
  const tone = TIER_TONE[phase.tier];
  return (
    <li className="relative flex flex-col items-center text-center px-1">
      <div
        className={
          "relative z-10 w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl shadow-lg ring-4 transition-transform motion-safe:hover:scale-110 " +
          tone.circle +
          " " +
          tone.ring
        }
      >
        {phase.num}
      </div>
      <p className="mt-3 text-sm font-semibold text-stewart-text leading-tight">
        {phase.label}
      </p>
      <p className={"mt-1 text-[11px] font-mono " + tone.label}>
        {phase.price}
      </p>
    </li>
  );
}

function CutoffMarker({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-stewart-muted">
      <span aria-hidden className="text-stewart-warning">
        &#9733;
      </span>
      {label}
    </span>
  );
}
