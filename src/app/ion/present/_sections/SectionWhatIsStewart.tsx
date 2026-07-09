// The clean break from the cup into Stewart. Stays on WHAT Stewart does —
// the HOW comes in a later step. Static: the question as a heading, the
// pain + the answer as bullet points beneath it (no click-through).
//
// DRAFT copy in Spencer's voice — refine freely. Positioning stays plain:
// no "AI / graph / LLM" language.

const PAIN = [
  "Your team leads can't hear every call — there's never enough time or bandwidth to review them before a one-on-one.",
  "Inconsistent coaching and training. Only a few calls ever get reviewed — and randomly selected calls may or may not be worth reviewing, or miss the part a setter is really struggling with.",
  "Bad habits stick. A rep drifts from Ion's way, no one catches it, and the same mistake gets used and reused — call after call.",
];

const DOES = [
  "Stewart reviews every call. Every rep, every call, every day — the one thing no team lead could ever do by hand.",
  "Then it hands your team managers only the calls worth reviewing — with the exact moments that need coaching already highlighted.",
  "Managers jump straight to the clip that matters, instead of sitting through the whole call.",
  "So every one-on-one starts from what actually happened. Not a guess. Not a sample. The whole floor, reviewed.",
];

export function SectionWhatIsStewart() {
  return (
    <section className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-20 border-b border-white/10">
      <div className="max-w-3xl">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          <span className="block">What is Powered by Stewart?</span>
          <span className="block">What does Stewart do?</span>
        </h2>

        <div className="mt-10">
          <ul className="space-y-4">
            {PAIN.map((item) => (
              <Bullet key={item} tone="muted">
                {item}
              </Bullet>
            ))}
          </ul>
        </div>

        <div className="mt-10">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent mb-4">
            What Stewart does
          </p>
          <ul className="space-y-4">
            {DOES.map((item) => (
              <Bullet key={item} tone="text">
                {item}
              </Bullet>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Bullet({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "muted" | "text";
}) {
  return (
    <li className="flex gap-3 text-lg sm:text-xl leading-relaxed">
      <span className="text-stewart-accent shrink-0 mt-1">•</span>
      <span className={tone === "text" ? "text-stewart-text" : "text-stewart-muted"}>
        {children}
      </span>
    </li>
  );
}
