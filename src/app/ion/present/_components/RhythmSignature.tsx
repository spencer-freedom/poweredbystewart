// Stewart's recurring five-word rhythm: "Observe. Understand. Classify.
// Route. Remember." Per the build plan it appears as the Sales Machine
// overlay (loud, primary — see SalesMachine.tsx) and recurs subtly as a
// section-footer signature here. Not spoken; absorbed. Each section lights
// the word(s) it embodies.

export type RhythmWord =
  | "Observe"
  | "Understand"
  | "Classify"
  | "Route"
  | "Remember";

const WORDS: RhythmWord[] = [
  "Observe",
  "Understand",
  "Classify",
  "Route",
  "Remember",
];

export function RhythmSignature({
  highlight,
}: {
  highlight?: RhythmWord | RhythmWord[];
}) {
  const lit = new Set(
    highlight ? (Array.isArray(highlight) ? highlight : [highlight]) : [],
  );
  return (
    <p
      className="mt-16 pt-8 border-t border-white/5 text-xs tracking-[0.3em] uppercase select-none"
      aria-hidden
    >
      {WORDS.map((w, i) => (
        <span key={w}>
          <span
            className={
              lit.has(w)
                ? "text-stewart-accent font-semibold"
                : "text-stewart-muted/40"
            }
          >
            {w}.
          </span>
          {i < WORDS.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
