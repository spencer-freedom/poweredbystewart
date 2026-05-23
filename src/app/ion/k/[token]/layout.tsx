import Link from "next/link";

// Layout for the lone surviving token-gated route — wiki/brain. Every
// other token-routed page from the pre-pivot pitch architecture (the 4
// IonNav tabs, the role-based views, the wiki parent, the cluster
// drilldown) was retired in the ion-scroll-demo branch. The new
// canonical Ion pitch surface is the public /ion scroll page.

export const dynamic = "force-dynamic";

export default function IonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stewart-bg text-stewart-text">
      <header className="border-b border-stewart-border bg-stewart-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Brand-mark routes to the public pitch surface — the token
              landing it used to point at was retired. */}
          <Link href="/ion" className="flex items-baseline gap-3">
            <span className="text-lg font-bold text-stewart-accent">
              Powered by Stewart
            </span>
            <span className="text-stewart-muted text-sm">×</span>
            <span className="text-base font-semibold text-stewart-text">
              Ion Solar
            </span>
          </Link>
          <span className="text-xs text-stewart-muted hidden sm:block">
            Inside-Sales Decision Tree · Built on your call data
          </span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {children}
      </main>
      <footer className="max-w-6xl mx-auto px-6 py-6 mt-12 border-t border-stewart-border text-xs text-stewart-muted">
        Built on 47 real Ion Solar inside-sales calls. Patterns are directional
        until replicated on a larger dataset. Powered by Stewart — SalesOS.
      </footer>
    </div>
  );
}
