import Link from "next/link";
import { IonNav } from "./_components/ion-nav";

export const dynamic = "force-dynamic";

export default async function IonLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const base = `/ion/k/${token}`;

  return (
    <div className="min-h-screen bg-stewart-bg text-stewart-text">
      <header className="border-b border-stewart-border bg-stewart-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={base} className="flex items-baseline gap-3">
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
        <IonNav base={base} />
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      <footer className="max-w-6xl mx-auto px-6 py-6 mt-12 border-t border-stewart-border text-xs text-stewart-muted">
        Built on 47 real Ion Solar inside-sales calls. Patterns are directional
        until replicated on a larger dataset. Powered by Stewart — SalesOS.
      </footer>
    </div>
  );
}
