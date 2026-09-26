import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { Bridge } from "../../present/_components/Bridge";

// Leads, one screen. The side salad: shown, not sold. Reads the buckets
// the manager surface already computes.

type Row = { bucket?: { key: string } };
type Def = { label: string; action: string; tone: string };

async function loadBuckets(): Promise<{ defs: Record<string, Def>; counts: Record<string, number>; total: number } | null> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "public", "ion", "triage-index.json"), "utf-8");
    const idx = JSON.parse(raw) as { buckets: Record<string, Def>; calls: Row[] };
    const counts: Record<string, number> = {};
    for (const r of idx.calls) {
      const k = r.bucket?.key ?? "no_appointment";
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return { defs: idx.buckets, counts, total: idx.calls.length };
  } catch {
    return null;
  }
}

const SHOW = ["fumbled_hot", "needs_co_owner", "quote_first", "roof_or_trees", "set_bill_promised", "set_no_bill", "credit_dq", "dq_other"];

export async function SectionLeadsGlance() {
  const b = await loadBuckets();
  if (!b) return null;
  const actionable = ["fumbled_hot", "needs_co_owner", "quote_first", "roof_or_trees", "callback", "set_bill_promised", "set_no_bill"].reduce((n, k) => n + (b.counts[k] ?? 0), 0);
  return (
    <section id="leads" className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10 scroll-mt-20">
      <div className="max-w-4xl w-full">
        <Bridge>And because every call is read, every lead lands somewhere.</Bridge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">{actionable} leads with a next move nobody has pulled a report on.</h2>
        <p className="mt-4 max-w-2xl text-lg text-stewart-muted leading-relaxed">
          The state of each lead after its call, by rule over the read. Not conversion rate &mdash; what happened, and what to do about it. Per call today; per lead the day Salesforce is connected.
        </p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SHOW.filter((k) => b.defs[k] && b.counts[k]).map((k) => (
            <div key={k} className="rounded-lg border border-stewart-border bg-stewart-card p-4">
              <p className="font-mono text-2xl font-bold text-stewart-text">{b.counts[k]}</p>
              <p className="mt-1 text-sm font-semibold text-stewart-text">{b.defs[k].label}</p>
              <p className="mt-1 text-xs text-stewart-muted leading-snug">{b.defs[k].action}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-stewart-muted">
          Every bucket opens to its calls, with the tape. <Link href="/ion/manager" className="text-stewart-accent hover:underline">Manager &rarr; Leads</Link>
        </p>
      </div>
    </section>
  );
}
