// Section wrapper for the /ion scroll page.
// Renders an anchor id (for direct-link sharing only — no visible nav),
// a clear visible TODO marker that Strategy Claude will replace with real
// section content in subsequent commits, and an optional children slot for
// any structural placeholders the scaffolding needs to lock in early
// (e.g. the <video> shell in § 4 or the CTA button in § 6).

export function ScrollSection({
  id,
  title,
  eyebrow,
  todoNote,
  children,
}: {
  id: string;
  title: string;
  eyebrow?: string;
  todoNote: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 py-16 sm:py-20 border-b border-stewart-border/60 last:border-b-0"
    >
      {eyebrow ? (
        <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl sm:text-3xl font-bold text-stewart-text leading-tight">
        {title}
      </h2>

      <div className="mt-8 rounded-lg border border-dashed border-stewart-warning/50 bg-stewart-warning/5 p-6">
        <p className="text-xs uppercase tracking-wider font-semibold text-stewart-warning mb-2">
          TODO · content from Strategy Claude
        </p>
        <p className="text-sm text-stewart-muted leading-relaxed">{todoNote}</p>
      </div>

      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  );
}
