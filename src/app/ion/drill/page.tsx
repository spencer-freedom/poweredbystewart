import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { AudioClip } from "../(public)/_components/AudioClip.client";

export const dynamic = "force-dynamic";

// /ion/drill — "click it." Any number on /ion/stats opens here as the list
// of calls behind it, each with the exact moment and a play button. Reads
// the published per-call briefs; no new inference, no summary — the
// evidence, one call per row.
//
//   ?section=bill_collection&status=skipped        script section by status
//   ?section=bill_collection&result=deferred       … by event result
//   ?bill_doc=received_on_call|promised_later|declined|not_asked
//   ?bill_flip=yes|no|no_bill_captured
//   ?reason=asked|not_asked|used|not_used
//   ?objections=0|1|2|3+                            most angles tried on the call
//   ?objection_type=cost|trust_or_scam|...
//   ?credit=650|670                                 threshold the rep stated
//   ?outcome=booked|tentative|callback|no_appointment|dq
//   &rep=Name   narrows any of the above

type Brief = {
  call_id: string; rep_name?: string | null; trajectory_summary?: string;
  observed_outcome?: { outcome: string; ts?: string | null; quote?: string | null } | null;
  bill_anchor_audit?: { bill_captured: boolean; bill_ts: string; flip_executed: string; flip_ts?: string } | null;
  bill_document_audit?: { asked: boolean; ask_ts: string; result: string; method: string; result_ts: string; ask_quote?: string | null; result_quote?: string | null } | null;
  interest_reason_audit?: { asked: boolean; ask_ts: string; reason_given: boolean; reason_used: string; reason_ts?: string; use_ts?: string; reason_quote?: string | null } | null;
  script_coverage?: { section: string; status: string; ts: string; end_ts?: string; quote?: string; customer_quote?: string; result?: string; customer_response?: string; resistance_reason?: string }[] | null;
  objections?: { ts: string; quote: string; type: string; rep_attempts: number; resolved: boolean; attempt_quotes?: string[] }[] | null;
  primary_coaching_focus?: { topic: string; ts: string } | null;
};
type Meta = { call_id: string; rep_id?: string | null; duration_min?: number | null; metrics?: { credit_threshold_stated?: number | null } | null };

const CLIP_LEAD = 5, CLIP_LEN = 22;
const sec = (ts?: string | null) => { if (!ts) return null; const [m, s] = ts.split(":").map((x) => parseInt(x, 10) || 0); return m * 60 + s; };
const label = (k: string) => k.replace(/_/g, " ");

async function loadAll(): Promise<{ brief: Brief; meta: Meta }[]> {
  const dir = path.join(process.cwd(), "public", "ion", "calls");
  const names = (await fs.readdir(dir)).filter((n) => n.endsWith("-manager-brief.json"));
  return Promise.all(
    names.map(async (n) => {
      const slug = n.slice(0, -"-manager-brief.json".length);
      const brief = JSON.parse(await fs.readFile(path.join(dir, n), "utf-8")) as Brief;
      let meta: Meta = { call_id: brief.call_id };
      try { meta = JSON.parse(await fs.readFile(path.join(dir, `${slug}-metadata.json`), "utf-8")) as Meta; } catch {}
      return { brief, meta };
    })
  );
}

type Hit = { call: string; rep: string; outcome: string; ts: string | null; line: string; why: string; duration: number | null };

export default async function DrillPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const g = (k: string) => { const v = sp[k]; return Array.isArray(v) ? v[0] : v; };
  const all = await loadAll();
  const rep = g("rep");
  const hits: Hit[] = [];
  const parts: string[] = [];

  for (const { brief: b, meta: m } of all) {
    const repName = b.rep_name || m.rep_id || "Unknown";
    if (rep && repName !== rep) continue;
    const outcome = b.observed_outcome?.outcome ?? "?";
    const base = { call: b.call_id, rep: repName, outcome, duration: m.duration_min ?? null };
    const focusTs = b.primary_coaching_focus?.ts ?? null;

    if (g("section")) {
      const c = (b.script_coverage ?? []).find((x) => x.section === g("section"));
      if (!c) continue;
      if (g("status") && c.status !== g("status")) continue;
      if (g("result") && c.result !== g("result")) continue;
      if (g("response") && c.customer_response !== g("response")) continue;
      hits.push({ ...base, ts: c.ts || focusTs, line: c.customer_quote || c.quote || "", why: c.status === "asked" ? `${label(c.customer_response ?? "")}${c.resistance_reason ? ` · ${label(c.resistance_reason)}` : ""} → ${label(c.result ?? "")}` : c.status.replace("_", " ") });
      continue;
    }
    if (g("bill_doc")) {
      const d = b.bill_document_audit; if (!d || d.result !== g("bill_doc")) continue;
      hits.push({ ...base, ts: d.result_ts || d.ask_ts || focusTs, line: d.result_quote || d.ask_quote || "", why: `${d.asked ? `asked @ ${d.ask_ts}` : "never asked"} → ${label(d.result)}${d.method && d.method !== "none" ? ` via ${d.method}` : ""}` });
      continue;
    }
    if (g("bill_flip")) {
      const a = b.bill_anchor_audit; if (!a || a.flip_executed !== g("bill_flip")) continue;
      hits.push({ ...base, ts: a.flip_ts || a.bill_ts || focusTs, line: "", why: a.bill_captured ? `bill captured @ ${a.bill_ts} → flip ${a.flip_executed}` : "no bill captured" });
      continue;
    }
    if (g("reason")) {
      const r = b.interest_reason_audit; if (!r) continue;
      const want = g("reason");
      const ok = want === "asked" ? r.asked : want === "not_asked" ? !r.asked : want === "used" ? r.reason_used === "yes" : r.reason_used === "no";
      if (!ok) continue;
      hits.push({ ...base, ts: r.use_ts || r.reason_ts || r.ask_ts || focusTs, line: r.reason_quote || "", why: `${r.asked ? `asked @ ${r.ask_ts}` : "not asked"}${r.reason_given ? ` · reason given` : ""} · used: ${r.reason_used}` });
      continue;
    }
    if (g("objections") || g("objection_type")) {
      const obs = b.objections ?? [];
      const max = obs.length ? Math.max(...obs.map((o) => o.rep_attempts || 0)) : -1;
      const bucket = max < 0 ? null : max === 0 ? "0" : max === 1 ? "1" : max === 2 ? "2" : "3+";
      if (g("objections") && bucket !== g("objections")) continue;
      const typed = g("objection_type") ? obs.filter((o) => o.type === g("objection_type")) : obs;
      if (!typed.length) continue;
      const top = [...typed].sort((a, z) => (z.rep_attempts || 0) - (a.rep_attempts || 0))[0];
      hits.push({ ...base, ts: top.ts, line: top.quote, why: `${label(top.type)} · ${top.rep_attempts} angle${top.rep_attempts === 1 ? "" : "s"} · ${top.resolved ? "resolved" : "unresolved"}${typed.length > 1 ? ` · +${typed.length - 1} more` : ""}` });
      continue;
    }
    if (g("credit")) {
      const v = m.metrics?.credit_threshold_stated; if (!v || String(v) !== g("credit")) continue;
      const c = (b.script_coverage ?? []).find((x) => x.section === "tax_credit_qualifier");
      hits.push({ ...base, ts: c?.ts || focusTs, line: c?.quote || "", why: `rep stated ${v}` });
      continue;
    }
    if (g("outcome")) {
      if (outcome !== g("outcome")) continue;
      hits.push({ ...base, ts: b.observed_outcome?.ts || focusTs, line: b.observed_outcome?.quote || "", why: `outcome: ${label(outcome)}` });
      continue;
    }
  }
  for (const k of ["section", "status", "result", "response", "bill_doc", "bill_flip", "reason", "objections", "objection_type", "credit", "outcome", "rep"]) if (g(k)) parts.push(`${k} = ${g(k)}`);
  hits.sort((a, b) => a.rep.localeCompare(b.rep) || a.call.localeCompare(b.call));
  const set = hits.filter((h) => h.outcome === "booked" || h.outcome === "tentative").length;

  return (
    <main className="min-h-screen bg-stewart-bg text-stewart-text">
      <header className="sticky top-0 z-40 border-b border-stewart-border bg-stewart-card/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2"><span className="text-sm font-bold text-stewart-accent">Stewart</span><span className="text-stewart-muted text-xs">·</span><span className="text-sm font-semibold">The calls behind the number</span></div>
          <nav className="flex items-center gap-3 text-xs"><Link href="/ion/stats" className="text-stewart-muted hover:text-stewart-text">← stats</Link><Link href="/ion/manager" className="text-stewart-muted hover:text-stewart-text">manager</Link></nav>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-xs uppercase tracking-wider text-stewart-muted">{parts.length ? parts.join(" · ") : "no filter"}</p>
        <h1 className="text-xl sm:text-2xl font-bold mt-1">{hits.length} call{hits.length === 1 ? "" : "s"}{hits.length ? ` · ${set} set (${Math.round((100 * set) / hits.length)}%)` : ""}</h1>
        <p className="text-sm text-stewart-muted mt-1">Every row is a real call. The timestamp is the moment the number came from; play it.</p>
        {!parts.length ? (
          <p className="mt-6 text-sm text-stewart-muted">Open this page from a number on <Link href="/ion/stats" className="text-stewart-accent hover:underline">/ion/stats</Link>.</p>
        ) : null}
        <ul className="mt-6 divide-y divide-stewart-border/60 rounded-lg border border-stewart-border">
          {hits.map((h) => {
            const s = sec(h.ts);
            const start = s !== null ? Math.max(0, s - CLIP_LEAD) : null;
            return (
              <li key={h.call} className="px-4 py-3 grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center">
                <div>
                  <p className="text-sm font-semibold">{h.rep}</p>
                  <p className={"text-[10px] uppercase tracking-wider font-medium " + (h.outcome === "booked" || h.outcome === "tentative" ? "text-stewart-success" : "text-stewart-muted")}>{label(h.outcome)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-stewart-muted">{h.why}{h.ts ? <span className="font-mono"> · {h.ts}</span> : null}</p>
                  {h.line ? <p className="text-sm text-stewart-text truncate">&ldquo;{h.line}&rdquo;</p> : null}
                  <Link href={`/ion/calls#${h.call}`} className="text-[11px] text-stewart-accent hover:underline">{h.call}</Link>
                </div>
                <div className="flex items-center gap-2">
                  {start !== null ? <AudioClip callId={h.call} startSec={start} endSec={start + CLIP_LEN} label="Play" /> : <AudioClip callId={h.call} variant="full" label="Play call" />}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
