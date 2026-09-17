import { Bridge } from "../_components/Bridge";
import { RepLift } from "../_components/RepLift.client";

// The transition beat: managers first, on purpose; then the reps, where the
// ROI step-changes because the read touches every call, not four a day.
// Everything a rep would get already exists on the manager surface.

const STEPS = [
  {
    step: "1",
    title: "Managers first. On purpose.",
    body: "Six people who can tell a wrong read from a right one, with the authority to say so. Every mistake Stewart makes in this phase gets caught by someone with no reason to game it. High stakes, small blast radius. This is where Ion learns to trust the numbers.",
  },
  {
    step: "2",
    title: "Then the reps, with what's already built.",
    body: "“Train here” is a rep’s gap by section. “Learn from” is the teammate who runs that section best, with the clip. The objection table is the replacement word track with a number on it — this move sets 45%, this one 70%, here’s yours, here’s theirs. A rep who reads that every morning and applies it goes from new to good faster than any ride-along.",
  },
  {
    step: "3",
    title: "And it’s all on the tape.",
    body: "Closes per 1,000 dials, per rep, against that rep’s own baseline from the manager phase. Reps come on in waves, so the ones on the daily brief and the ones not yet on it run side by side on the same leads and the same month. Ion doesn’t have to take the lift on faith. It watches its own number move.",
  },
];

export function SectionRepsNext() {
  return (
    <section
      id="reps"
      className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10 scroll-mt-20"
    >
      <div className="max-w-3xl w-full">
        <Bridge>
          That was the manager math. The bigger number is one step further, and
          the order matters.
        </Bridge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          Managers coach four calls a day. A rep can learn from every one.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-stewart-muted leading-relaxed">
          Where this turns into serious return for Ion is when the reps use it
          as their daily training &mdash; shown where they went wrong, and what
          to say instead, from what is actually working on this floor.
        </p>

        <ol className="mt-10 space-y-5">
          {STEPS.map((s) => (
            <li key={s.step} className="flex gap-4">
              <span className="shrink-0 w-8 h-8 rounded-full border border-stewart-accent/60 text-stewart-accent font-mono text-sm flex items-center justify-center">
                {s.step}
              </span>
              <div>
                <p className="text-base font-semibold text-stewart-text">{s.title}</p>
                <p className="mt-1 text-sm text-stewart-muted leading-relaxed">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10">
          <RepLift />
        </div>
      </div>
    </section>
  );
}
