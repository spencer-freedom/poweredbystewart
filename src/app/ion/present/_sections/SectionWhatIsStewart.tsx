import { Fragment } from "react";

// The clean break from the cup into Stewart. Stays on WHAT Stewart does —
// the HOW comes in a later step. Static: the question as a heading, then a
// two-column grid — the pain (white) on the left, what Stewart does (blue)
// on the right, aligned row by row (no click-through).
//
// DRAFT copy in Spencer's voice — refine freely. Positioning stays plain:
// no "AI / graph / LLM" language.

// Each pain point (white, left) is answered by what Stewart does (blue,
// right) on the same row. `answer: null` = pain stated, Stewart side still
// to be written.
const PAIRS: { pain: string; answer: string | null }[] = [
  {
    pain: "Your team leads can't listen to every call.",
    answer: "Stewart listens to every call.",
  },
  {
    pain: "There's never enough time or bandwidth to review the right calls before one-on-one call reviews.",
    answer:
      "Stewart identifies and feeds your managers the calls they should review, and highlights the parts that need coaching — with clips to listen to and Ion's coachable recommendations.",
  },
  {
    pain: "Inconsistent coaching and training. Only a few calls ever get reviewed — and randomly selected calls may or may not be worth reviewing, or miss the part a setter is really struggling with.",
    answer:
      "Stewart reviews every rep, every day, and surfaces the moments that actually need work — so every setter gets coached on what they're really struggling with, not on a random sample.",
  },
  {
    pain: "Bad habits stick. A rep drifts from Ion's way, no one catches it, and the same mistake gets used and reused — call after call.",
    answer:
      "Stewart catches the drift the first time it shows up — measured against Ion's own script — so it gets corrected before it becomes a habit.",
  },
];

export function SectionWhatIsStewart() {
  return (
    <section className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-20 border-b border-white/10">
      <div className="max-w-5xl w-full">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          <span className="block">What does Stewart do?</span>
        </h2>

        {/* Column labels */}
        <div className="mt-10 hidden sm:grid sm:grid-cols-2 gap-x-12 text-xs uppercase tracking-[0.2em] font-semibold">
          <p className="text-stewart-muted">The problem</p>
          <p className="text-stewart-accent">What Stewart does</p>
        </div>

        {/* Two columns: pain (white) left, Stewart's answer (blue) right,
            aligned row by row. */}
        <div className="mt-4 grid gap-x-12 gap-y-8 sm:grid-cols-2 sm:gap-y-0">
          {PAIRS.map((p, i) => {
            const rowDivider =
              i > 0 ? "sm:border-t sm:border-white/10 sm:pt-8" : "";
            return (
              <Fragment key={p.pain}>
                <p
                  className={`text-lg sm:text-xl leading-relaxed text-stewart-text ${rowDivider}`}
                >
                  {p.pain}
                </p>
                <div className={rowDivider}>
                  {p.answer ? (
                    <p className="text-lg sm:text-xl leading-relaxed text-stewart-accent font-medium">
                      {p.answer}
                    </p>
                  ) : null}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}
