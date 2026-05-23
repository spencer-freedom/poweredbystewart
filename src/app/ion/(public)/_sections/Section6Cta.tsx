import Link from "next/link";
import { ScrollSection } from "./ScrollSection";

export function Section6Cta() {
  return (
    <ScrollSection id="next">
      <div className="rounded-2xl border border-stewart-accent/40 bg-gradient-to-br from-stewart-accent/10 via-stewart-card to-stewart-bg p-8 sm:p-12 lg:p-16">
        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent mb-4">
          The ask
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight max-w-3xl">
          Ready to see what the work looks like?
        </h2>

        <p className="mt-6 text-lg text-stewart-muted leading-relaxed max-w-2xl">
          Defined scope, transparent pricing, real exit criteria. No
          long-term contract. No big upfront fees. Spencer + Stewart in
          the building until your managers can run zero-prep coaching
          from the briefs.
        </p>

        <div className="mt-10">
          <Link
            href="/ion/whats-next"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-lg bg-stewart-accent text-white text-base sm:text-lg font-semibold hover:bg-stewart-accent/90 transition-colors shadow-lg shadow-stewart-accent/20"
          >
            Defined Scope of Work &rarr;
          </Link>
        </div>
      </div>
    </ScrollSection>
  );
}
