"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { getDemandSignals, getPreorders, searchCatalog, getBuyBoard } from "@/lib/stewart-api";
import type {
  DemandSignalsPayload,
  DemandSignalGroup,
  DemandSignalItem,
  PreordersPayload,
  PreorderItem,
  CatalogSearchItem,
  BuyBoardPayload,
  BuyBoardItem,
} from "@/lib/stewart-api";
import { PageInfo } from "@/components/page-info";

function fmtK(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function PressingHint({ count, units }: { count: number | null; units: number | null }) {
  if (!count || count <= 1) return null;
  return (
    <span className="text-[10px] text-sky-400/70 shrink-0" title="Combined demand across all pressings of this album">
      · {count} pressings · {fmtK(units ?? 0)} album
    </span>
  );
}

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
          Live record-store velocity from <span className="text-stewart-accent">Provo&apos;s Vintage Groove</span>
        </p>
      </div>

      <PageInfo pageId="marketing" title="What is Demand Signals?">
        <p>
          A live read of what is moving in the record store right now — Trending
          (last 7 days), Hot (last 30 days), and building Momentum (accelerating
          sell-through) — split by Vinyl and CD. Use it to time promos, features,
          and inventory pushes around real demand.
        </p>
      </PageInfo>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">{error}</div>
      )}

      <ArtistSearch />

      <BuyBoardSection />

      {preorders && <PreordersSection report={preorders} />}

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
        </>
      )}
    </div>
  );
}

function ArtistSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CatalogSearchItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState("");
  const [gapsOnly, setGapsOnly] = useState(false);
  const [gapCount, setGapCount] = useState(0);
  const [indieOnly, setIndieOnly] = useState(false);
  const [indieCount, setIndieCount] = useState(0);

  const run = useCallback(async (gaps: boolean, indie: boolean) => {
    const term = q.trim();
    if (!term) return;
    setBusy(true);
    try {
      const res = await searchCatalog(term, 80, gaps, indie);
      setResults(res.results);
      setGapCount(res.gap_count);
      setIndieCount(res.indie_count);
      setSearched(res.query);
    } catch {
      setResults([]);
      setGapCount(0);
      setIndieCount(0);
      setSearched(term);
    } finally {
      setBusy(false);
    }
  }, [q]);

  const toggleGaps = () => {
    const next = !gapsOnly;
    setGapsOnly(next);
    if (results !== null) run(next, indieOnly);
  };
  const toggleIndie = () => {
    const next = !indieOnly;
    setIndieOnly(next);
    if (results !== null) run(gapsOnly, next);
  };

  return (
    <div className="bg-stewart-card border border-stewart-border rounded-lg p-6 space-y-4">
      <div>
        <h2 className="text-sm font-medium text-stewart-muted uppercase tracking-wider">Artist / Album Search — Buy View</h2>
        <p className="text-xs text-stewart-muted/70 mt-1">
          Search a band or album — every title carried, ranked best-seller-first, with the live Square
          shelf count. <span className="text-red-400 font-medium">BUY</span> flags the hits you&apos;re out of or low on.
        </p>
      </div>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run(gapsOnly, indieOnly)}
          placeholder="e.g. Radiohead, Taylor Swift, Miles Davis…"
          className="flex-1 bg-stewart-bg border border-stewart-border rounded-md px-3 py-2 text-sm text-stewart-text placeholder:text-stewart-muted focus:outline-none focus:border-stewart-accent"
        />
        <button
          onClick={() => run(gapsOnly, indieOnly)}
          disabled={busy || !q.trim()}
          className="px-4 py-2 rounded-md bg-stewart-accent/15 text-stewart-accent text-sm font-medium hover:bg-stewart-accent/25 disabled:opacity-40"
        >
          {busy ? "Searching…" : "Search"}
        </button>
      </div>
      {results !== null && !(results.length === 0 && !gapsOnly) && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-stewart-muted">
              <span className="text-red-400 font-semibold">{gapCount}</span> restock gap{gapCount === 1 ? "" : "s"}
              {" · "}<span className="text-purple-400 font-semibold">{indieCount}</span> indie for &ldquo;{searched}&rdquo;
            </p>
            <div className="flex gap-1">
              <button
                onClick={toggleIndie}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  indieOnly ? "bg-purple-500/15 text-purple-400" : "text-stewart-muted hover:text-stewart-text"
                }`}
              >
                Indie only
              </button>
              <button
                onClick={toggleGaps}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  gapsOnly ? "bg-red-500/15 text-red-400" : "text-stewart-muted hover:text-stewart-text"
                }`}
              >
                Buy gaps only
              </button>
            </div>
          </div>
          {results.length === 0 ? (
            <p className="text-sm text-stewart-muted py-2">No restock gaps — stocked on the movers.</p>
          ) : (
            <ul className="divide-y divide-stewart-border/50">
              {results.map((it) => (
                <li key={it.upc || it.title} className={`flex items-center gap-3 py-2 ${it.buy ? "-mx-2 px-2 rounded bg-red-500/[0.05]" : ""}`}>
                  <Thumb src={it.image} alt={it.title} />
                  <div className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm text-stewart-text truncate">{it.title}</span>
                      {it.indie_exclusive && <span className="px-1 py-0.5 rounded bg-purple-500/15 text-purple-400 font-semibold text-[9px] shrink-0">IE</span>}
                      <PressingHint count={it.pressing_count} units={it.release_units_90d} />
                    </span>
                    {it.buy && <span className="text-[11px] text-red-400/90">{it.buy_reason}</span>}
                  </div>
                  {it.buy && <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold text-[10px]">BUY</span>}
                  <span
                    className={`text-sm font-mono font-semibold w-14 text-right ${
                      it.stock_status === "out" ? "text-red-400" : it.stock_status === "low" ? "text-amber-400" : "text-stewart-text"
                    }`}
                    title="On hand (Square)"
                  >{it.on_hand} on
                  </span>
                  <span className="text-sm font-mono font-semibold text-emerald-400 w-16 text-right" title="Trailing-90d units">{it.units_90d}u</span>
                  <span className="text-xs font-mono text-stewart-muted w-20 text-right" title="Alliance sales rank">
                    {it.sales_rank != null ? `#${it.sales_rank.toLocaleString()}` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function BuyBoardSection() {
  const [data, setData] = useState<BuyBoardPayload | null>(null);
  const [orderableOnly, setOrderableOnly] = useState(true);
  const [fmt, setFmt] = useState("");
  const [indieOnly, setIndieOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (ord: boolean, f: string, indie: boolean) => {
    setLoading(true);
    try {
      setData(await getBuyBoard({ limit: 250, orderableOnly: ord, fmt: f || undefined, minUnits: 5, indieOnly: indie }));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(orderableOnly, fmt, indieOnly); }, [load, orderableOnly, fmt, indieOnly]);

  const fmtBtn = (label: string, val: string) => (
    <button
      key={val}
      onClick={() => setFmt(val)}
      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
        fmt === val ? "bg-stewart-accent/15 text-stewart-accent" : "text-stewart-muted hover:text-stewart-text"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-stewart-card border border-stewart-border rounded-lg p-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-stewart-muted uppercase tracking-wider">Buy Board</h2>
        {data && <span className="text-xs text-stewart-muted/70">{data.total_gaps} restock gaps</span>}
      </div>
      <p className="text-xs text-stewart-muted/70 -mt-1">
        Every title across the catalog out of or low on stock while demand is strong — ranked by demand,
        with what Alliance can fill.
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1">{fmtBtn("All", "")}{fmtBtn("Vinyl", "vinyl")}{fmtBtn("CD", "cd")}</div>
        <button
          onClick={() => setOrderableOnly(!orderableOnly)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            orderableOnly ? "bg-emerald-500/15 text-emerald-400" : "text-stewart-muted hover:text-stewart-text"
          }`}
        >
          {orderableOnly ? "Orderable only" : "All"}
        </button>
        <button
          onClick={() => setIndieOnly(!indieOnly)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            indieOnly ? "bg-purple-500/15 text-purple-400" : "text-stewart-muted hover:text-stewart-text"
          }`}
        >
          Indie{data ? ` (${data.indie_gaps})` : ""}
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-stewart-muted py-2">Loading buy board…</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-stewart-muted py-2">No restock gaps match.</p>
      ) : (
        <ul className="divide-y divide-stewart-border/50">
          {data.items.map((it: BuyBoardItem) => (
            <li key={it.shopify_product_id} className="flex items-center gap-3 py-2">
              <Thumb src={it.image} alt={it.title} />
              <div className="flex-1 min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm text-stewart-text truncate">{it.title}</span>
                  {it.indie_exclusive && <span className="px-1 py-0.5 rounded bg-purple-500/15 text-purple-400 font-semibold text-[9px] shrink-0">IE</span>}
                  <PressingHint count={it.pressing_count} units={it.release_units_90d} />
                </span>
                {it.buy_reason && <span className="text-[11px] text-red-400/90">{it.buy_reason}</span>}
              </div>
              <span
                className={`text-sm font-mono font-semibold w-14 text-right ${it.on_hand <= 0 ? "text-red-400" : "text-amber-400"}`}
                title="On hand (Square)"
              >{it.on_hand} on</span>
              <span className="w-16 text-right text-sm font-mono" title="Alliance available to order">
                {it.orderable ? (
                  <span className="text-emerald-400 font-semibold">{it.alliance_qty}</span>
                ) : (
                  <span className="text-red-400/70 text-xs">none</span>
                )}
              </span>
              <span className="text-sm font-mono font-semibold text-sky-400 w-14 text-right" title="Trailing-90d units">{it.units_90d}u</span>
              <span className="text-xs font-mono text-stewart-muted w-16 text-right" title="Sales rank">
                {it.sales_rank != null ? `#${it.sales_rank.toLocaleString()}` : "—"}
              </span>
            </li>
          ))}
        </ul>
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
