import Link from "next/link";

// /ion/present — the long-scroll Stewart pitch surface (Kenny + VP).
//
// This route lives OUTSIDE the (public) route group on purpose: the
// pitch hero needs a full-bleed black canvas + its own sticky nav, which
// fight the constrained chrome in (public)/layout.tsx (shared by the
// brain/calls/schema/sow deep-dive pages). Building here leaves /ion
// (the Hub), /ion/demo, and every deep-dive page 100% untouched.
//
// AppShell (src/components/app-shell.tsx) already bypasses its sidebar
// for any /ion* path, so this layout renders full-bleed under the root
// <body> with no extra chrome.

export const dynamic = "force-dynamic";

// Sticky top-nav tabs — deep-dive escape hatches for Q&A. Each links to
// an existing /ion page; they are NOT in-page scroll anchors.
const NAV_TABS: { href: string; label: string }[] = [
  { href: "/ion/present/script", label: "Script" },
  { href: "/ion/brain", label: "Brain" },
  { href: "/ion/schema", label: "Schema" },
  { href: "/ion/calls", label: "Calls" },
  { href: "/ion/sow", label: "SOW" },
];

export default function IonPresentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-stewart-text scroll-smooth">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/ion" className="flex items-baseline gap-2 shrink-0">
            <span className="text-sm sm:text-base font-bold text-stewart-accent">
              Powered by Stewart
            </span>
            <span className="text-stewart-muted text-xs">×</span>
            <span className="text-sm font-semibold text-stewart-text">
              Ion Solar
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV_TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-stewart-muted hover:text-stewart-text hover:bg-white/5 transition-colors"
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
      <footer className="max-w-6xl mx-auto px-6 py-10 border-t border-white/10 text-xs text-stewart-muted">
        Powered by Stewart — SalesOS. Built on Ion Solar inside-sales call
        data.
      </footer>
    </div>
  );
}
