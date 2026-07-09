// The clean break from the cup into Stewart. Stays on WHAT Stewart does —
// the HOW comes in a later step. Static: the question as a heading, the
// pain + the answer as bullet points beneath it (no click-through).
//
// DRAFT copy in Spencer's voice — refine freely. Positioning stays plain:
// no "AI / graph / LLM" language.

// Each pain point (blue) is answered by what Stewart does (white) right
// beneath it. `answer: null` = pain stated, Stewart side still to be written.
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
      <div className="max-w-3xl">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          <span className="block">What is Powered by Stewart?</span>
          <span className="block">What does Stewart do?</span>
        </h2>

        <div className="mt-10 space-y-8">
          {PAIRS.map((p) => (
            <div key={p.pain}>
              <p className="flex gap-3 text-lg sm:text-xl leading-relaxed text-stewart-accent">
                <span className="shrink-0 mt-1">•</span>
                <span>{p.pain}</span>
              </p>
              {p.answer ? (
                <p className="mt-2 pl-6 text-lg sm:text-xl leading-relaxed text-stewart-text font-medium">
                  {p.answer}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
