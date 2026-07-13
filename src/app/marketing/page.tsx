"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { getDemandSignals, getPreorders } from "@/lib/stewart-api";
import type {
  DemandSignalsPayload,
  DemandSignalGroup,
  DemandSignalItem,
  PreordersPayload,
  PreorderItem,
} from "@/lib/stewart-api";
import { PageInfo } from "@/components/page-info";

export default function MarketingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<DemandSignalsPayload | null>(null);
  const [preorders, setPreorders] = useState<PreordersPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, pre] = await Promise.all([getDemandSignals(50), getPreorders(250)]);
      setData(res);
      setPreorders(pre);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load demand signals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) load();
  }, [isLoaded, isSignedIn, load]);

  // Auth guard — any signed-in user (single-user site; no role gating needed).
  if (!isLoaded || !isSignedIn) {
    return <div className="text-center text-stewart-muted py-12 text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stewart-text">Demand Signals</h1>
        <p className="text-sm text-stewart-muted">
          Live record-store velocity from <span className="text-stewart-accent">Provo&apos;s Vintage Groove</span> — the titles to put ad spend behind
        </p>
      </div>

      <PageInfo pageId="marketing" title="What is Demand Signals?">
        <p>
          A live read of what is moving in the record store right now — Trending
          (last 7 days), Hot (last 30 days), and building Momentum (accelerating
          sell-through) — split by Vinyl and CD, plus the upcoming Pre-Orders.
          Use it to time promos, features, and ad sets around real demand.
        </p>
      </PageInfo>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center text-stewart-muted py-12 text-sm">Loading demand signals...</div>
      ) : !data ? (
        <div className="bg-stewart-card border border-stewart-border rounded-lg p-12 text-center">
          <p className="text-stewart-muted text-sm">No demand signals available.</p>
        </div>
      ) : (
        <>
          <SignalSection title="Trending" windowLabel={data.windows.trending} group={data.trending} />
          <SignalSection title="Hot" windowLabel={data.windows.hot} group={data.hot} />
          <SignalSection title="Momentum" windowLabel={data.windows.momentum} group={data.momentum} />
          {preorders && <PreordersSection report={preorders} />}
        </>
      )}
    </div>
  );
}

function PreordersSection({ report }: { report: PreordersPayload }) {
  const [active, setActive] = useState(report.collections[0]?.handle ?? "");
  const current = report.collections.find((c) => c.handle === active) ?? report.collections[0];
  if (!current) return null;

  return (
    <div className="bg-stewart-card border border-stewart-border rounded-lg p-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-stewart-muted uppercase tracking-wider">Pre-Orders</h2>
        <span className="text-xs text-stewart-muted/70">ranked by Alliance demand</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {report.collections.map((c) => (
          <button
            key={c.handle}
            onClick={() => setActive(c.handle)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              c.handle === active
                ? "bg-stewart-accent/15 text-stewart-accent"
                : "text-stewart-muted hover:text-stewart-text"
            }`}
          >
            {c.label} <span className="opacity-60">({c.count})</span>
          </button>
        ))}
      </div>
      {current.items.length === 0 ? (
        <p className="text-sm text-stewart-muted py-2">No pre-orders in this collection.</p>
      ) : (
        <ul className="divide-y divide-stewart-border/50">
          {current.items.map((it: PreorderItem) => (
            <li key={`${it.position}-${it.title}`} className="flex items-center gap-3 py-2">
              <span className="w-6 text-right text-sm font-mono text-stewart-muted flex-shrink-0">{it.position}</span>
              <Thumb src={it.image} alt={it.title} />
              <span className="flex-1 text-sm text-stewart-text truncate">{it.title}</span>
              <span className="text-sm font-mono font-semibold text-stewart-accent w-20 text-right">
                {it.sales_rank != null ? `#${it.sales_rank.toLocaleString()}` : "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SignalSection({
  title,
  windowLabel,
  group,
}: {
  title: string;
  windowLabel: string;
  group: DemandSignalGroup;
}) {
  return (
    <div className="bg-stewart-card border border-stewart-border rounded-lg p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-medium text-stewart-muted uppercase tracking-wider">{title}</h2>
        <span className="text-xs text-stewart-muted/70">{windowLabel}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RankedList label="Vinyl" items={group.vinyl} />
        <RankedList label="CD" items={group.cd} />
      </div>
    </div>
  );
}

function RankedList({ label, items }: { label: string; items: DemandSignalItem[] }) {
  return (
    <div>
      <p className="text-xs font-medium text-stewart-accent uppercase tracking-wider mb-3">{label}</p>
      {items.length === 0 ? (
        <p className="text-xs text-stewart-muted/70 py-4">No {label.toLowerCase()} signals.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={`${item.rank}-${item.title}`} className="flex items-center gap-3">
              <span className="w-6 text-right text-sm font-mono text-stewart-muted flex-shrink-0">{item.rank}</span>
              <Thumb src={item.image} alt={item.title} />
              <span className="text-sm text-stewart-text truncate">{item.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Thumb({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="w-10 h-10 rounded bg-stewart-border flex items-center justify-center text-[10px] font-mono text-stewart-muted flex-shrink-0">
        ♪
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="w-10 h-10 rounded object-cover bg-stewart-border flex-shrink-0" />;
}
