// Placeholder wrapper for the long-scroll pitch sections (#2–#8).
//
// Build #1 only reserves the scroll real estate: each section renders its
// heading + the one executive question it must answer (the section's
// litmus test per the build plan) + a marker for which later Build fills
// it in. Content lands build-by-build.

export function PitchSection({
  id,
  index,
  title,
  question,
  build,
}: {
  id: string;
  index: number;
  title: string;
  question: string;
  build: string;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20 border-b border-white/10 last:border-b-0"
    >
      <div className="max-w-6xl mx-auto px-6 py-24 sm:py-28 min-h-[60vh] flex flex-col justify-center">
        <div className="flex items-baseline gap-4 mb-4">
          <span className="text-sm font-mono text-stewart-accent">
            {String(index).padStart(2, "0")}
          </span>
          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-muted">
            {build}
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight max-w-4xl">
          {title}
        </h2>

        <div className="mt-8 max-w-2xl rounded-lg border border-stewart-accent/30 bg-stewart-accent/5 px-6 py-5">
          <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-2">
            The one question this section answers
          </p>
          <p className="text-lg sm:text-xl text-stewart-text leading-snug">
            {question}
          </p>
        </div>

        <p className="mt-8 text-sm text-stewart-muted">
          Placeholder — content lands in {build}.
        </p>
      </div>
    </section>
  );
}
