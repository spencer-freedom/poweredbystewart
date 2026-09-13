import Link from "next/link";
import { Bridge } from "../_components/Bridge";
import { loadCorpusStats } from "../_lib/corpus";

// The two findings the second run was for, measured on every call:
// the bill itself (ask → what happened → set rate) and objection
// persistence (how many angles the rep tried → set rate). Both read from
// corpus-stats.json; both click through to the calls behind them.

const pct = (r: number | null | undefined) => (r === null || r === undefined ? "–" : `${Math.round(r * 100)}%`);

export async function SectionBillAndObjections() {
  const s = await loadCorpusStats();
  if (!s?.bill_document || !s.adherence_vs_outcome || !s.objections) return null;
  const A = s.adherence_vs_outcome.anchors;
  const r = s.bill_document.results;
  const asked = (r.received_on_call ?? 0) + (r.promised_later ?? 0) + (r.declined ?? 0);
  const o = s.objections;
  const buckets = ["0", "1", "2", "3+"].map((k) => ({ k, ...(o.set_rate_by_max_attempts[k] ?? { set: 0, n: 0, set_rate: null }) }));

  return (
    <section
      id="bill"
      className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10 scroll-mt-20"
    >
      <div className="max-w-4xl w-full">
        <Bridge>
          Two more things nobody at Ion has ever been able to count. Same {s.calls} calls.
        </Bridge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          The bill, and the fight for it.
        </h2>

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {/* The bill itself */}
          <div className="rounded-xl border border-stewart-accent/40 bg-stewart-accent/5 p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-stewart-accent">The bill itself</p>
            <p className="mt-1 text-sm text-stewart-muted">Ion builds the design from it. What happens when a rep asks &mdash; and when they don&apos;t.</p>
            <ol className="mt-4 space-y-2.5">
              <Row label={`Asked for the bill`} n={asked} of={s.bill_document.measured_on} rate={A.bill_doc_asked?.set_rate} />
              <Row label="↳ got it on the call" n={r.received_on_call ?? 0} of={asked} rate={A.bill_doc_received_on_call?.set_rate} tone="good" href="/ion/drill?bill_doc=received_on_call" />
              <Row label="↳ promised later" n={r.promised_later ?? 0} of={asked} rate={A.bill_doc_promised_later?.set_rate} tone="warn" href="/ion/drill?bill_doc=promised_later" />
              <Row label="Never asked" n={r.not_asked ?? 0} of={s.bill_document.measured_on} rate={A.bill_doc_not_asked?.set_rate} tone="bad" href="/ion/drill?bill_doc=not_asked" />
            </ol>
            <p className="mt-4 text-base text-stewart-text leading-relaxed">
              Get the bill on the phone and the appointment sets{" "}
              <span className="font-mono font-bold text-stewart-success">{pct(A.bill_doc_received_on_call?.set_rate)}</span> of the time.
              Take &ldquo;I&apos;ll send it later&rdquo; and it&apos;s{" "}
              <span className="font-mono font-bold">{pct(A.bill_doc_promised_later?.set_rate)}</span>.
              Don&apos;t ask, <span className="font-mono font-bold">{pct(A.bill_doc_not_asked?.set_rate)}</span>.
            </p>
          </div>

          {/* Objections: angles tried */}
          <div className="rounded-xl border border-stewart-accent/40 bg-stewart-accent/5 p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-stewart-accent">When the customer pushes back</p>
            <p className="mt-1 text-sm text-stewart-muted">{o.calls_with_objections} calls had an objection. How many angles did the rep try before moving on &mdash; and did it matter?</p>
            <ol className="mt-4 space-y-2.5">
              {buckets.map((b) => (
                <li key={b.k} className="grid grid-cols-[4.5rem_minmax(0,1fr)_4rem] items-center gap-3">
                  <Link href={`/ion/drill?objections=${encodeURIComponent(b.k)}`} className="font-mono text-sm text-stewart-text hover:text-stewart-accent hover:underline">
                    {b.k === "0" ? "none" : b.k} {b.k === "1" ? "angle" : "angles"}
                  </Link>
                  <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <div className={"h-full rounded-full " + (b.k === "0" ? "bg-stewart-danger/70" : "bg-stewart-accent/75")} style={{ width: `${Math.round((b.set_rate ?? 0) * 100)}%` }} />
                  </div>
                  <span className={"font-mono text-sm text-right " + (b.n < 20 ? "text-stewart-muted" : "text-stewart-text")}>{pct(b.set_rate)}<span className="block text-[10px] text-stewart-muted">n={b.n}</span></span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-base text-stewart-text leading-relaxed">
              One angle instead of none: <span className="font-mono font-bold">{pct(buckets[1].set_rate)}</span> vs{" "}
              <span className="font-mono font-bold text-stewart-danger">{pct(buckets[0].set_rate)}</span>. A second angle:{" "}
              <span className="font-mono font-bold text-stewart-success">{pct(buckets[2].set_rate)}</span>.
              Persistence is the most trainable thing on this floor.
            </p>
          </div>
        </div>

        <p className="mt-8 text-sm text-stewart-muted">
          Every rate is a link to the calls behind it &mdash; the rep, the moment, the tape.{" "}
          <Link href="/ion/stats" className="text-stewart-accent hover:underline">All the numbers &rarr;</Link>
        </p>
      </div>
    </section>
  );
}

function Row({ label, n, of, rate, tone, href }: { label: string; n: number; of: number; rate: number | null | undefined; tone?: "good" | "warn" | "bad"; href?: string }) {
  const color = tone === "good" ? "text-stewart-success" : tone === "warn" ? "text-stewart-warning" : tone === "bad" ? "text-stewart-danger" : "text-stewart-text";
  const w = of ? Math.round((100 * n) / of) : 0;
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_4rem] items-center gap-3">
      <div className="min-w-0">
        {href ? <Link href={href} className="text-sm text-stewart-text hover:text-stewart-accent hover:underline">{label} <span className="text-stewart-muted">→</span></Link> : <span className="text-sm text-stewart-text">{label}</span>}
        <div className="mt-1 h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-stewart-accent/60" style={{ width: `${w}%` }} /></div>
        <p className="text-[10px] font-mono text-stewart-muted mt-0.5">{n} of {of}</p>
      </div>
      <span className={"font-mono text-sm text-right font-semibold " + color}>{pct(rate)}<span className="block text-[10px] font-normal text-stewart-muted">set</span></span>
    </li>
  );
}
