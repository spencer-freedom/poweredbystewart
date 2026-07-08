// Shared frame for every real pitch section (#2–#8). Provides the anchor
// id, consistent vertical rhythm, the eyebrow + headline, the one
// executive question the section answers (the build plan's litmus test),
// and the recurring rhythm-phrase signature in the footer.

import { RhythmSignature, type RhythmWord } from "./RhythmSignature";

export function SectionFrame({
  id,
  index,
  eyebrow,
  title,
  question,
  highlight,
  children,
}: {
  id: string;
  index: number;
  eyebrow: string;
  title: string;
  question: string;
  // Which rhythm word(s) this section embodies — lit in the footer.
  highlight?: RhythmWord | RhythmWord[];
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20 border-b border-white/10 last:border-b-0"
    >
      <div className="max-w-6xl mx-auto px-6 py-24 sm:py-28">
        <div className="flex items-baseline gap-4 mb-3">
          <span className="text-sm font-mono text-stewart-accent">
            {String(index).padStart(2, "0")}
          </span>
          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-muted">
            {eyebrow}
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight max-w-4xl">
          {title}
        </h2>

        <p className="mt-4 text-sm italic text-stewart-muted max-w-2xl">
          The one question this answers: &ldquo;{question}&rdquo;
        </p>

        <div className="mt-10">{children}</div>

        <RhythmSignature highlight={highlight} />
      </div>
    </section>
  );
}
