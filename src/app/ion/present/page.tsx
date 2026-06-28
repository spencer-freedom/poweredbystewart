import { AtomHero } from "./_components/AtomHero.client";
import { PitchSection } from "./_sections/PitchSection";

export const dynamic = "force-dynamic";

// /ion/present — the single-page scroll Stewart pitch.
//
// Build #1: hero (moving atom + dismissible About-Spencer card) +
// sticky top-nav (in layout.tsx) + sections #2–#8 stubbed with their
// heading and the one executive question each must answer. Later builds
// fill each section in; the close anchor (#close) lives inside the SOW
// section so /ion/present#close stays URL-shareable.

const SECTIONS: {
  id: string;
  title: string;
  question: string;
  build: string;
}[] = [
  {
    id: "how-stewart-works",
    title: "How Stewart Works",
    question: "Why hasn't existing software solved this?",
    build: "Build #2",
  },
  {
    id: "brain",
    title: "The Brain",
    question: "Can it actually understand?",
    build: "Build #3",
  },
  {
    id: "coaching",
    title: "The Coaching Surface",
    question: "Is the leakage real?",
    build: "Build #4",
  },
  {
    id: "leak-atlas",
    title: "The Leak Atlas",
    question: "Where is the money leaking?",
    build: "Build #5",
  },
  {
    id: "economics",
    title: "The Economics",
    question: "Is the economics meaningful?",
    build: "Build #6",
  },
  {
    id: "morning-view",
    title: "The Daily Morning View",
    question: "How would my managers actually use this?",
    build: "Build #7",
  },
];

export default function IonPresentPage() {
  return (
    <>
      {/* Section #1 — hero */}
      <AtomHero />

      {/* Sections #2–#7 — stubbed */}
      {SECTIONS.map((section, i) => (
        <PitchSection
          key={section.id}
          id={section.id}
          index={i + 2}
          title={section.title}
          question={section.question}
          build={section.build}
        />
      ))}

      {/* Section #8 — SOW + Close. Carries the shareable #close anchor. */}
      <section
        id="sow"
        className="scroll-mt-20 border-b border-white/10"
      >
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-28 min-h-[60vh] flex flex-col justify-center">
          <div className="flex items-baseline gap-4 mb-4">
            <span className="text-sm font-mono text-stewart-accent">08</span>
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-muted">
              Build #8
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight max-w-4xl">
            Scope of Work &amp; Close
          </h2>

          <div className="mt-8 max-w-2xl rounded-lg border border-stewart-accent/30 bg-stewart-accent/5 px-6 py-5">
            <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-2">
              The one question this section answers
            </p>
            <p className="text-lg sm:text-xl text-stewart-text leading-snug">
              What&apos;s the first step? Do we want this?
            </p>
          </div>

          <p className="mt-8 text-sm text-stewart-muted">
            Placeholder — content lands in Build #8.
          </p>

          {/* Shareable close anchor — content lands in Build #8. */}
          <div id="close" className="scroll-mt-20 mt-16 pt-10 border-t border-white/10">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-muted">
              The close
            </p>
            <p className="mt-3 text-sm text-stewart-muted">
              Placeholder — close copy lands in Build #8. Reachable at
              <span className="font-mono text-stewart-text"> /ion/present#close</span>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
