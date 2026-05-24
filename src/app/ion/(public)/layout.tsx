import Link from "next/link";

// Public Ion Solar pitch surface — no auth.
// When Clerk is added later, wrap this layout (or the parent) with the
// Clerk provider/middleware and gate via roles. Today: public.

export const dynamic = "force-dynamic";

export default function IonPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stewart-bg text-stewart-text">
      <header className="border-b border-stewart-border bg-stewart-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/ion" className="flex items-baseline gap-3">
            <span className="text-lg font-bold text-stewart-accent">
              Powered by Stewart
            </span>
            <span className="text-stewart-muted text-sm">×</span>
            <span className="text-base font-semibold text-stewart-text">
              Ion Solar
            </span>
          </Link>
          <Link
            href="/ion/whats-next"
            className="text-sm text-stewart-muted hover:text-stewart-text transition-colors"
          >
            What&apos;s Next →
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
      <footer className="max-w-6xl mx-auto px-6 py-8 mt-16 border-t border-stewart-border text-xs text-stewart-muted">
        Powered by Stewart — SalesOS. Built on Ion Solar inside-sales call
        data.
      </footer>
    </div>
  );
}
