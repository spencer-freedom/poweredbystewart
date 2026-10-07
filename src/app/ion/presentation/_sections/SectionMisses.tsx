import { readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { AudioClip } from "../../(public)/_components/AudioClip.client";
import { Bridge } from "../../present/_components/Bridge";

// After one call done right: four chunks of calls that weren't. Picked by
// rule from the published reads — grounded quote, a named rep, one moment
// per failure type — so the contrast is Stewart's, not hand-picked.

type Row = { call_id: string; slug: string; rep_id: string | null; booked: boolean; quotes: { grounded: boolean | null }; bucket?: { key: string } };
type Pick = { ts: string; quote: string; classification: string; stewart_read: string; coaching_implication?: string };

const WANT: { cls: string; label: string }[] = [
  { cls: "curiosity_creation_failure", label: "The customer handed over the reason. The rep filed it." },
  { cls: "unanchored_soft_exit", label: "The call ended without a time. Nobody owned the next step." },
  { cls: "objection_inversion_miss", label: "An objection the playbook says to reframe. The rep accepted it." },
  { cls: "setter_scope_creep", label: "The setter started closing. The appointment lost its reason to exist." },
];
const CLIP_LEAD = 5;
const CLIP_LEN = 22;
const tsToSeconds = (ts: string) => { const [m, s] = ts.split(":").map((x) => parseInt(x, 10) || 0); return (m || 0) * 60 + (s || 0); };

async function pickMisses() {
  const root = path.join(process.cwd(), "public", "ion");
  const idx = JSON.parse(readFileSync(path.join(root, "triage-index.json"), "utf-8")) as { calls: Row[] };
  const rows = idx.calls.filter((r) => r.rep_id && r.quotes?.grounded && !r.booked);
  const out: { row: Row; pick: Pick; label: string }[] = [];
  const usedReps = new Set<string>();
  for (const w of WANT) {
    for (const r of rows) {
      if (usedReps.has(r.rep_id!)) continue;
      let picks: Pick[] = [];
      try { picks = JSON.parse(readFileSync(path.join(root, "calls", `${r.slug}-cherrypicks.json`), "utf-8")) as Pick[]; } catch { continue; }
      const p = picks.find((x) => x.classification === w.cls && x.ts && x.quote);
      if (p) { out.push({ row: r, pick: p, label: w.label }); usedReps.add(r.rep_id!); break; }
    }
  }
  return out;
}

export async function SectionMisses({ bridge }: { bridge?: React.ReactNode } = {}) {
  const misses = await pickMisses();
  if (!misses.length) return null;
  return (
    <section id="misses" className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10 scroll-mt-20">
      <div className="max-w-4xl w-full">
        <Bridge>{bridge ?? "That's a call where the script ran. Most don't run like that. Four moments, four reps — picked by Stewart, not by me."}</Bridge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">And the chunks where it goes wrong.</h2>
        <ul className="mt-10 space-y-4">
          {misses.map(({ row, pick, label }) => {
            const start = Math.max(0, tsToSeconds(pick.ts) - CLIP_LEAD);
            return (
              <li key={row.call_id} className="rounded-xl border border-stewart-border bg-stewart-card p-5">
                <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-stewart-warning">{label}</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-stewart-muted">
                  <span className="font-semibold text-stewart-text">{row.rep_id}</span>
                  <span className="font-mono">{pick.ts}</span>
                  <span>{pick.classification.replace(/_/g, " ")}</span>
                </div>
                <p className="mt-2 text-lg text-stewart-text leading-snug">&ldquo;{pick.quote}&rdquo;</p>
                <p className="mt-2 text-sm text-stewart-muted leading-relaxed">{pick.stewart_read}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <AudioClip callId={row.call_id} startSec={start} endSec={start + CLIP_LEN} label="Play the moment" />
                  <Link href={`/ion/listen?call=${encodeURIComponent(row.call_id)}&m=${start}-${start + CLIP_LEN}:${encodeURIComponent(pick.classification.replace(/_/g, " "))}`} className="text-xs text-stewart-muted hover:text-stewart-accent">share the clip &#8599;</Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
