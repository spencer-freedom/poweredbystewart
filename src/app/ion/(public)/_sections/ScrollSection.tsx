// Structural wrapper used by every scroll-page section. Provides the
// anchor id (for direct-link sharing only — no visible nav), shared
// vertical rhythm, and the dividing rule between sections. Each section
// component is responsible for its own internal layout, eyebrow,
// headline, and body — keeping this file tiny.

export function ScrollSection({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={
        "scroll-mt-24 py-16 sm:py-20 border-b border-stewart-border/60 last:border-b-0" +
        (className ? ` ${className}` : "")
      }
    >
      {children}
    </section>
  );
}
