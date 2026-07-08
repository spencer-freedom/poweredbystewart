// The upside flip — right after 0-of-332. The same two anchors, now USED:
// the customer's own reason for wanting solar + their bill, to reinforce
// the want and set the appointment. Downstream effects run the schema's own
// KPI chain: set rate → sit rate → close-from-sit.

const EFFECTS = [
  {
    kpi: "Set rate",
    title: "More appointments set.",
    body: "The appointment gets set on the customer's own reason — not a pitch they can brush off.",
  },
  {
    kpi: "Sit rate",
    title: "Stickier sits.",
    body: "They prioritize showing up, because it's their reason on the line. Fewer no-shows.",
  },
  {
    kpi: "Close-from-sit",
    title: "Easier closes.",
    body: "The specialist walks in already knowing what to hit — the setter handed them the sale.",
  },
];

export function SectionImagine() {
  return (
    <section className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10">
      <div className="max-w-3xl w-full">
        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent mb-4">
          Now imagine the opposite
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          Imagine every call used what the customer already gave you.
        </h2>
        <p className="mt-5 text-lg text-stewart-muted leading-relaxed">
          Their reason for wanting solar, and their bill — used to reinforce
          the want, and to set the appointment.
        </p>

        <div className="mt-12 grid sm:grid-cols-3 gap-5">
          {EFFECTS.map((e) => (
            <div
              key={e.kpi}
              className="rounded-xl border border-stewart-border bg-stewart-card p-5"
            >
              <p className="text-[11px] uppercase tracking-wider font-semibold text-stewart-accent mb-2">
                {e.kpi}
              </p>
              <p className="text-lg font-bold text-stewart-text leading-snug">
                {e.title}
              </p>
              <p className="mt-2 text-sm text-stewart-muted leading-relaxed">
                {e.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-lg text-stewart-text">
          Set rate. Sit rate. Close. <span className="text-stewart-muted">One move the customer already handed the rep — all three.</span>
        </p>
      </div>
    </section>
  );
}
