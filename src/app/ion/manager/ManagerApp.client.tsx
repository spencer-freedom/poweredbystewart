"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AudioClip, tsToSeconds } from "../(public)/_components/AudioClip.client";
import { CallDetailDrawer } from "../(public)/calls/CallDetailDrawer.client";
import type { TriageComponents, TriageIndex, TriageRow } from "./types";
import { FUNNEL_SECTIONS, ScriptFunnel, type FunnelInput } from "../present/_components/ScriptFunnel.client";

// The manager surface, for real. Three views:
//   Today  — the N calls worth a manager's time, ranked by the triage score,
//            one per rep, with the moment's clip and the full read a click away.
//   Reps   — every setter: calls read, average score, biggest recurring gap.
//   Weights— the score's five components, on sliders. Spencer's first guess;
//            Ion's managers tune it in week two. Nothing here is a model —
//            the score is arithmetic over Stewart's reads.
// "Mark as coached" persists in this browser only (localStorage) — a
// demo convenience until there are user accounts.

const COACHED_KEY = "stewart-ion-coached";
const CLIP_LEAD_SEC = 5;
const CLIP_LEN_SEC = 22;
type Tab = "today" | "reps" | "floor" | "weights";
type WeightKey = keyof TriageComponents;
const WEIGHT_KEYS: WeightKey[] = ["leak", "fragile", "protocol", "bill", "signals"];

const SHAPE_LABEL: Record<string, string> = {
  energy_leaked: "Energy leaked",
  stagnant: "Stagnant",
  mixed: "Mixed",
  energy_built: "Energy built",
};
const FLIP_LABEL: Record<TriageRow["bill_flip"], string> = {
  not_flipped: "Bill captured, not flipped",
  flipped: "Bill flipped",
  no_bill: "No bill captured",
  unclear: "Bill — unclear",
};

function scoreOf(r: TriageRow, w: TriageComponents): number {
  return WEIGHT_KEYS.reduce((s, k) => s + w[k] * r.components[k], 0);
}
function maxScore(w: TriageComponents): number {
  return WEIGHT_KEYS.reduce((s, k) => s + w[k], 0);
}
function flagOf(r: TriageRow): { label: string; cls: string } {
  if (r.booked && r.unresolved_concerns >= 1) return { label: "Booked · fragile", cls: "text-stewart-accent" };
  if (r.shape === "energy_built") return { label: "Share with the team", cls: "text-stewart-success" };
  if (r.booked) return { label: "Booked", cls: "text-stewart-success" };
  if (r.shape === "stagnant") return { label: "Stalled", cls: "text-stewart-danger" };
  return { label: "Recover", cls: "text-stewart-warning" };
}

export function ManagerApp({ index }: { index: TriageIndex }) {
  const [tab, setTab] = useState<Tab>("today");
  const [weights, setWeights] = useState<TriageComponents>(index.default_weights);
  const [n, setN] = useState(4);
  const [onePerRep, setOnePerRep] = useState(true);
  const [repFilter, setRepFilter] = useState<string | null>(null);
  const [coached, setCoached] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<TriageRow | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COACHED_KEY);
      if (raw) setCoached(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, []);
  const toggleCoached = (id: string) =>
    setCoached((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(COACHED_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });

  const ranked = useMemo(
    () =>
      index.calls
        .map((r) => ({ ...r, score: scoreOf(r, weights) }))
        .sort((a, b) => b.score - a.score),
    [index.calls, weights]
  );

  // Today's list: highest scores, skipping coached, one per rep, N deep.
  const today = useMemo(() => {
    const seen = new Set<string>();
    const out: TriageRow[] = [];
    for (const r of ranked) {
      if (out.length >= n) break;
      if (coached.has(r.call_id)) continue;
      if (repFilter && r.rep_id !== repFilter) continue;
      const rep = r.rep_id || "Unknown";
      if (onePerRep && seen.has(rep)) continue;
      seen.add(rep);
      out.push(r);
    }
    return out;
  }, [ranked, n, onePerRep, coached, repFilter]);

  const share = useMemo(
    () => ranked.find((r) => r.share && !coached.has(r.call_id) && (!repFilter || r.rep_id === repFilter)) ?? null,
    [ranked, coached, repFilter]
  );

  // Floor run-rate per section (among calls that reached it) and each
  // section's set-rate lift (ran vs skipped) — the inputs to "train here".
  const floorStats = useMemo(() => {
    const isSet = (r: TriageRow) => r.observed_outcome === "booked" || r.observed_outcome === "tentative";
    const out: Record<string, { rate: number | null; lift: number }> = {};
    for (const sec of TRAIN_SECTIONS) {
      const ran = ranked.filter((r) => r.coverage?.[sec.key] === "asked");
      const skipped = ranked.filter((r) => r.coverage?.[sec.key] === "skipped");
      const reached = ran.length + skipped.length;
      const rr = ran.length ? ran.filter(isSet).length / ran.length : null;
      const sr = skipped.length ? skipped.filter(isSet).length / skipped.length : null;
      out[sec.key] = { rate: reached ? ran.length / reached : null, lift: rr !== null && sr !== null && Math.min(ran.length, skipped.length) >= 20 ? Math.max(0, rr - sr) : 0 };
    }
    return out;
  }, [ranked]);

  const reps = useMemo(() => {
    const by = new Map<string, TriageRow[]>();
    for (const r of ranked) {
      const k = r.rep_id || "Unknown";
      by.set(k, [...(by.get(k) ?? []), r]);
    }
    return [...by.entries()]
      .map(([rep, rows]) => {
        // Train here: biggest run-rate gap vs the floor, needs ≥3 reached calls,
        // nudged toward sections that move the set rate.
        const train = TRAIN_SECTIONS.map((sec) => {
          const ran = rows.filter((r) => r.coverage?.[sec.key] === "asked").length;
          const reached = ran + rows.filter((r) => r.coverage?.[sec.key] === "skipped").length;
          const f = floorStats[sec.key];
          if (reached < 3 || !f || f.rate === null) return null;
          const gap = f.rate - ran / reached;
          return { key: sec.key, label: sec.label, gap, score: gap * (1 + f.lift * 5), reached, ran };
        })
          .filter((x): x is NonNullable<typeof x> => x !== null && x.gap > 0.1)
          .sort((a, b) => b.score - a.score)
          .slice(0, 2);
        const avg = rows.reduce((s, r) => s + r.score, 0) / rows.length;
        const comp = WEIGHT_KEYS.map((k) => ({
          k,
          v: rows.reduce((s, r) => s + r.components[k], 0) / rows.length,
        })).sort((a, b) => b.v - a.v);
        const shapes = rows.reduce<Record<string, number>>((acc, r) => {
          const s = r.shape || "unknown";
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {});
        return { rep, rows, avg, gap: comp[0], shapes, train, coached: rows.filter((r) => coached.has(r.call_id)).length };
      })
      .sort((a, b) => b.rows.length - a.rows.length);
  }, [ranked, coached, floorStats]);

  const max = maxScore(weights);

  return (
    <div className="min-h-screen bg-stewart-bg text-stewart-text">
      <header className="sticky top-0 z-40 border-b border-stewart-border bg-stewart-card/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-stewart-accent">Stewart</span>
            <span className="text-stewart-muted text-xs">·</span>
            <span className="text-sm font-semibold">Manager</span>
            <span className="hidden sm:inline text-xs text-stewart-muted ml-2">
              {index.total_calls} calls read · {index.reps.length} reps
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {(["today", "reps", "floor", "weights"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={
                  "px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors " +
                  (tab === t ? "bg-stewart-accent/15 text-stewart-accent" : "text-stewart-muted hover:text-stewart-text")
                }
              >
                {t}
              </button>
            ))}
            <Link href="/ion/present" className="ml-2 px-2 py-1.5 text-xs text-stewart-muted hover:text-stewart-text">
              ← pitch
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {tab === "today" ? (
          <Today
            rows={today}
            share={share}
            n={n}
            max={max}
            coached={coached}
            repFilter={repFilter}
            onClearRep={() => setRepFilter(null)}
            onToggle={toggleCoached}
            onOpen={setOpen}
          />
        ) : tab === "reps" ? (
          <Reps
            reps={reps}
            max={max}
            labels={index.weight_labels}
            onPick={(rep) => {
              setRepFilter(rep);
              setTab("today");
            }}
            onOpen={setOpen}
            coached={coached}
          />
        ) : tab === "floor" ? (
          <Floor rows={ranked} onPick={(rep) => { setRepFilter(rep); setTab("today"); }} />
        ) : (
          <Weights
            weights={weights}
            labels={index.weight_labels}
            defaults={index.default_weights}
            n={n}
            onePerRep={onePerRep}
            onWeights={setWeights}
            onN={setN}
            onOnePerRep={setOnePerRep}
          />
        )}
      </main>

      {open ? (
        <CallDetailDrawer
          callId={open.call_id}
          summary={{
            call_id: open.call_id,
            rep_id: open.rep_id,
            outcome: open.outcome,
            duration_min: open.duration_min ?? 0,
            demo_role: null,
            primary_objection: null,
            cherrypick_count: open.counts.moments,
            top_classifications: [],
            schema_references: [],
            aging_tier: "hot",
            is_hero: open.is_hero,
            tagline: open.tagline,
            is_gray_matter: false,
            gray_matter_section: null,
            has_handoff: open.booked,
          }}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}

// ── Today ────────────────────────────────────────────────────────────────

function Today({
  rows,
  share,
  n,
  max,
  coached,
  repFilter,
  onClearRep,
  onToggle,
  onOpen,
}: {
  rows: TriageRow[];
  share: TriageRow | null;
  n: number;
  max: number;
  coached: Set<string>;
  repFilter: string | null;
  onClearRep: () => void;
  onToggle: (id: string) => void;
  onOpen: (r: TriageRow) => void;
}) {
  const minutes = rows.reduce((s, r) => s + (r.duration_min || 0), 0);
  return (
    <div>
      <div className="mb-5">
        <p className="text-xs uppercase tracking-wider text-stewart-muted">Daily Morning View</p>
        <h1 className="text-xl sm:text-2xl font-bold mt-1">
          {repFilter ? `${repFilter}: ` : "Today you have "}
          {rows.length} call{rows.length === 1 ? "" : "s"} worth your time.
        </h1>
        <p className="text-sm text-stewart-muted mt-1">
          Top {n} by score, one per rep, coached ones drop off.
          {minutes ? ` ${Math.round(minutes)} min of calls, ~${Math.max(1, Math.round((rows.length * CLIP_LEN_SEC) / 60))} min of listening.` : ""}
          {repFilter ? (
            <button type="button" onClick={onClearRep} className="ml-2 text-stewart-accent hover:underline">
              all reps
            </button>
          ) : null}
        </p>
      </div>

      <ul className="space-y-3">
        {rows.map((r) => (
          <CallCard key={r.call_id} r={r} max={max} done={coached.has(r.call_id)} onToggle={onToggle} onOpen={onOpen} />
        ))}
        {rows.length === 0 ? (
          <li className="rounded-lg border border-stewart-border bg-stewart-card p-6 text-sm text-stewart-muted">
            Nothing left uncoached at these settings.
          </li>
        ) : null}
      </ul>

      {share ? (
        <div className="mt-8">
          <p className="text-xs uppercase tracking-wider text-stewart-success mb-2">Worth sharing with the team</p>
          <CallCard r={share} max={max} done={coached.has(share.call_id)} onToggle={onToggle} onOpen={onOpen} positive />
        </div>
      ) : null}

      <p className="mt-8 text-[11px] text-stewart-muted italic leading-relaxed">
        Every card is a real call from the 300. The ranking is arithmetic over Stewart&apos;s reads — see
        Weights — not a model deciding what you should care about.
      </p>
    </div>
  );
}

function CallCard({
  r,
  max,
  done,
  onToggle,
  onOpen,
  positive,
}: {
  r: TriageRow;
  max: number;
  done: boolean;
  onToggle: (id: string) => void;
  onOpen: (r: TriageRow) => void;
  positive?: boolean;
}) {
  const flag = positive ? { label: "Share with the team", cls: "text-stewart-success" } : flagOf(r);
  const ts = r.focus?.ts ?? null;
  const start = ts ? Math.max(0, tsToSeconds(ts) - CLIP_LEAD_SEC) : null;
  const pct = max > 0 ? Math.round((r.score / max) * 100) : 0;
  return (
    <li
      className={
        "rounded-lg border bg-stewart-card p-4 transition-colors " +
        (done ? "border-stewart-success/40 opacity-70" : "border-stewart-border")
      }
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{r.rep_id || "Unknown rep"}</span>
        <span className="text-xs font-mono text-stewart-muted">
          {r.duration_min ? `${Math.round(r.duration_min)} min · ` : ""}
          {ts ?? ""}
        </span>
      </div>
      <p className={"mt-1 text-xs uppercase tracking-wider font-medium " + flag.cls}>{flag.label}</p>
      <p className="mt-1.5 text-sm font-semibold leading-snug">{r.headline || r.focus?.topic || "Open the read"}</p>
      <p className="mt-1.5 text-sm text-stewart-muted leading-relaxed">{r.why}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {r.shape ? <Chip>{SHAPE_LABEL[r.shape] ?? r.shape}</Chip> : null}
        {r.bill_flip === "not_flipped" ? <Chip tone="warn">{FLIP_LABEL[r.bill_flip]}</Chip> : null}
        {r.booked && r.unresolved_concerns ? <Chip tone="accent">{r.unresolved_concerns} unresolved for the closer</Chip> : null}
        {r.counts.protocol_violation + r.counts.knowledge_gap > 0 ? (
          <Chip>{r.counts.protocol_violation + r.counts.knowledge_gap} protocol / knowledge</Chip>
        ) : null}
        {r.counts.enthusiasm_signal > 0 ? <Chip>{r.counts.enthusiasm_signal} buying signal{r.counts.enthusiasm_signal > 1 ? "s" : ""}</Chip> : null}
        {r.quotes.grounded === true ? <Chip tone="ok">quotes verified {r.quotes.verified}/{r.quotes.checked}</Chip> : null}
        {r.quotes.grounded === false ? <Chip tone="warn">{(r.quotes.checked ?? 0) - (r.quotes.verified ?? 0)} quote{(r.quotes.checked ?? 0) - (r.quotes.verified ?? 0) === 1 ? "" : "s"} to re-check</Chip> : null}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full bg-stewart-accent/70" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] font-mono text-stewart-muted w-14 text-right">{r.score.toFixed(1)} / {max.toFixed(0)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {start !== null ? (
          <AudioClip callId={r.call_id} startSec={start} endSec={start + CLIP_LEN_SEC} label="Play the moment" />
        ) : (
          <AudioClip callId={r.call_id} variant="full" label="Play the call" />
        )}
        <button
          type="button"
          onClick={() => onOpen(r)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-stewart-border text-xs text-stewart-muted hover:text-stewart-text hover:border-stewart-accent/40 transition-colors"
        >
          Open Stewart&apos;s read →
        </button>
        <button
          type="button"
          onClick={() => onToggle(r.call_id)}
          className={
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs transition-colors " +
            (done
              ? "border-stewart-success/50 bg-stewart-success/10 text-stewart-success"
              : "border-stewart-border text-stewart-muted hover:text-stewart-text")
          }
        >
          {done ? "✓ Coached" : "Mark as coached"}
        </button>
      </div>
    </li>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "warn" | "accent" | "ok" }) {
  const cls =
    tone === "warn"
      ? "border-stewart-warning/40 text-stewart-warning"
      : tone === "accent"
      ? "border-stewart-accent/40 text-stewart-accent"
      : tone === "ok"
      ? "border-stewart-success/40 text-stewart-success"
      : "border-stewart-border text-stewart-muted";
  return <span className={"text-[10px] uppercase tracking-wider font-mono rounded px-1.5 py-0.5 border " + cls}>{children}</span>;
}

const TRAIN_SECTIONS: { key: string; label: string }[] = [
  { key: "intro_legitimacy", label: "Intro" },
  { key: "interest_question", label: "Interest question" },
  { key: "address_homeowner", label: "Address" },
  { key: "co_owner", label: "Co-owner" },
  { key: "roof", label: "Roof" },
  { key: "utility_company", label: "Utility" },
  { key: "bill_amount", label: "Bill" },
  { key: "tax_credit_qualifier", label: "Qualifier" },
  { key: "military", label: "Military" },
  { key: "prior_design", label: "Prior design" },
  { key: "bill_collection", label: "Bill collection" },
  { key: "button_up", label: "Button-up" },
];

// ── Reps ─────────────────────────────────────────────────────────────────

type RepRow = {
  rep: string;
  rows: TriageRow[];
  avg: number;
  gap: { k: WeightKey; v: number };
  shapes: Record<string, number>;
  train: { key: string; label: string; gap: number; score: number; reached: number; ran: number }[];
  coached: number;
};

function Reps({
  reps,
  max,
  labels,
  onPick,
  onOpen,
  coached,
}: {
  reps: RepRow[];
  max: number;
  labels: Record<WeightKey, string>;
  onPick: (rep: string) => void;
  onOpen: (r: TriageRow) => void;
  coached: Set<string>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div>
      <div className="mb-5">
        <p className="text-xs uppercase tracking-wider text-stewart-muted">Your floor</p>
        <h1 className="text-xl sm:text-2xl font-bold mt-1">{reps.length} setters, every call read.</h1>
        <p className="text-sm text-stewart-muted mt-1">
          Biggest gap = the score component that runs highest across that rep&apos;s calls. Train here = the script
          sections this rep runs least often relative to the floor (points under, among calls that reached the section),
          nudged toward the sections that move the set rate. Click a rep to see their calls; &ldquo;today&rdquo; filters the
          morning list to them.
        </p>
      </div>
      <div className="rounded-lg border border-stewart-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stewart-card text-[11px] uppercase tracking-wider text-stewart-muted">
            <tr>
              <th className="text-left px-3 py-2">Rep</th>
              <th className="text-right px-3 py-2">Calls</th>
              <th className="text-right px-3 py-2 hidden sm:table-cell">Avg score</th>
              <th className="text-left px-3 py-2">Biggest gap</th>
              <th className="text-left px-3 py-2">Train here</th>
              <th className="text-left px-3 py-2 hidden md:table-cell">Shape mix</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {reps.map((x) => (
              <RepLine key={x.rep} x={x} max={max} labels={labels} expanded={expanded === x.rep} onExpand={() => setExpanded(expanded === x.rep ? null : x.rep)} onPick={onPick} onOpen={onOpen} coached={coached} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RepLine({
  x,
  max,
  labels,
  expanded,
  onExpand,
  onPick,
  onOpen,
  coached,
}: {
  x: RepRow;
  max: number;
  labels: Record<WeightKey, string>;
  expanded: boolean;
  onExpand: () => void;
  onPick: (rep: string) => void;
  onOpen: (r: TriageRow) => void;
  coached: Set<string>;
}) {
  const total = x.rows.length;
  const order = ["energy_leaked", "stagnant", "mixed", "energy_built"];
  const color: Record<string, string> = {
    energy_leaked: "bg-stewart-warning/70",
    stagnant: "bg-stewart-danger/60",
    mixed: "bg-stewart-muted/50",
    energy_built: "bg-stewart-success/70",
  };
  return (
    <>
      <tr className="border-t border-stewart-border hover:bg-stewart-card/60">
        <td className="px-3 py-2 font-semibold">
          <button type="button" onClick={onExpand} className="hover:text-stewart-accent text-left">
            {expanded ? "▾ " : "▸ "}
            {x.rep}
          </button>
        </td>
        <td className="px-3 py-2 text-right font-mono text-stewart-muted">{total}</td>
        <td className="px-3 py-2 text-right font-mono text-stewart-muted hidden sm:table-cell">
          {x.avg.toFixed(1)} <span className="text-[10px]">/ {max.toFixed(0)}</span>
        </td>
        <td className="px-3 py-2 text-stewart-text">{labels[x.gap.k]}</td>
        <td className="px-3 py-2">
          {x.train.length ? (
            <span className="flex flex-wrap gap-1">
              {x.train.map((t) => (
                <span key={t.key} title={`ran it on ${t.ran} of ${t.reached} calls that reached it — ${Math.round(t.gap * 100)} pts under the floor`} className="text-[10px] uppercase tracking-wider font-mono rounded px-1.5 py-0.5 border border-stewart-warning/50 text-stewart-warning">
                  {t.label} −{Math.round(t.gap * 100)}
                </span>
              ))}
            </span>
          ) : (
            <span className="text-xs text-stewart-muted">at or above floor</span>
          )}
        </td>
        <td className="px-3 py-2 hidden md:table-cell">
          <div className="flex h-2 w-40 rounded-full overflow-hidden bg-white/5" title={order.map((s) => `${SHAPE_LABEL[s]}: ${x.shapes[s] || 0}`).join(" · ")}>
            {order.map((s) => (
              <div key={s} className={color[s]} style={{ width: `${((x.shapes[s] || 0) / total) * 100}%` }} />
            ))}
          </div>
        </td>
        <td className="px-3 py-2 text-right">
          <button type="button" onClick={() => onPick(x.rep)} className="text-xs text-stewart-accent hover:underline">
            today →
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-t border-stewart-border/60 bg-stewart-bg/60">
          <td colSpan={7} className="px-3 py-3">
            <ul className="divide-y divide-stewart-border/60">
              {x.rows.map((r) => (
                <li key={r.call_id} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-mono text-[11px] text-stewart-muted w-10 text-right">{r.score.toFixed(1)}</span>
                  <span className={"text-[10px] uppercase tracking-wider font-medium w-28 " + flagOf(r).cls}>{flagOf(r).label}</span>
                  <button type="button" onClick={() => onOpen(r)} className="flex-1 min-w-[12rem] text-left hover:text-stewart-accent">
                    {r.headline || r.focus?.topic || r.call_id}
                  </button>
                  {coached.has(r.call_id) ? <span className="text-[10px] text-stewart-success">✓ coached</span> : null}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      ) : null}
    </>
  );
}

// ── Weights ──────────────────────────────────────────────────────────────

function Weights({
  weights,
  labels,
  defaults,
  n,
  onePerRep,
  onWeights,
  onN,
  onOnePerRep,
}: {
  weights: TriageComponents;
  labels: Record<WeightKey, string>;
  defaults: TriageComponents;
  n: number;
  onePerRep: boolean;
  onWeights: (w: TriageComponents) => void;
  onN: (n: number) => void;
  onOnePerRep: (b: boolean) => void;
}) {
  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-wider text-stewart-muted">How the morning list is picked</p>
        <h1 className="text-xl sm:text-2xl font-bold mt-1">Five things, weighted. No model.</h1>
        <p className="text-sm text-stewart-muted mt-1 leading-relaxed">
          Each call gets 0–1 on each line below from Stewart&apos;s read; the score is the weighted sum. These weights
          are Spencer&apos;s first guess. Your managers set them — that&apos;s week two.
        </p>
      </div>

      <div className="rounded-lg border border-stewart-border bg-stewart-card p-4 sm:p-5 space-y-5">
        {WEIGHT_KEYS.map((k) => (
          <label key={k} className="block">
            <span className="flex items-baseline justify-between text-sm">
              <span>{labels[k]}</span>
              <span className="font-mono text-stewart-accent">{weights[k].toFixed(1)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={weights[k]}
              onChange={(e) => onWeights({ ...weights, [k]: Number(e.target.value) })}
              className="mt-1.5 w-full accent-[#3b82f6]"
            />
          </label>
        ))}

        <div className="pt-4 border-t border-stewart-border grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="flex items-baseline justify-between text-sm">
              <span>Calls per morning</span>
              <span className="font-mono text-stewart-accent">{n}</span>
            </span>
            <input type="range" min={1} max={8} step={1} value={n} onChange={(e) => onN(Number(e.target.value))} className="mt-1.5 w-full accent-[#3b82f6]" />
          </label>
          <label className="flex items-center gap-3 text-sm self-end">
            <input type="checkbox" checked={onePerRep} onChange={(e) => onOnePerRep(e.target.checked)} className="accent-[#3b82f6]" />
            One call per rep per morning
          </label>
        </div>

        <div className="pt-2">
          <button type="button" onClick={() => onWeights(defaults)} className="text-xs text-stewart-muted hover:text-stewart-text">
            Reset to Spencer&apos;s defaults
          </button>
        </div>
      </div>

      <p className="mt-5 text-xs text-stewart-muted italic leading-relaxed">
        Once Salesforce outcomes are joined, a sixth line appears here: how often calls with each gap actually sat.
        That&apos;s when the weights stop being anyone&apos;s guess.
      </p>
    </div>
  );
}


// ── Floor ────────────────────────────────────────────────────────────────
// The script, by rep. Each cell = share of that rep's calls where the
// section was run (calls that ended before the section don't count against
// them). Plus the two anchors: bill used / reason used. All counts.

const SECTIONS: { key: string; label: string }[] = [
  { key: "intro_legitimacy", label: "Intro" },
  { key: "interest_question", label: "Interest" },
  { key: "address_homeowner", label: "Address" },
  { key: "co_owner", label: "Co-owner" },
  { key: "roof", label: "Roof" },
  { key: "utility_company", label: "Utility" },
  { key: "bill_amount", label: "Bill" },
  { key: "tax_credit_qualifier", label: "Qualifier" },
  { key: "military", label: "Military" },
  { key: "prior_design", label: "Prior design" },
  { key: "bill_collection", label: "Bill collect" },
  { key: "appointment_set", label: "Appt set" },
  { key: "button_up", label: "Button-up" },
];

function cellTone(rate: number | null): string {
  if (rate === null) return "bg-white/5 text-stewart-muted/50";
  if (rate >= 0.75) return "bg-stewart-success/60 text-white";
  if (rate >= 0.45) return "bg-stewart-accent/50 text-white";
  if (rate >= 0.2) return "bg-stewart-warning/60 text-black";
  return "bg-stewart-danger/60 text-white";
}

function Floor({ rows, onPick }: { rows: TriageRow[]; onPick: (rep: string) => void }) {
  const [minCalls, setMinCalls] = useState(5);
  const reps = useMemo(() => {
    const by = new Map<string, TriageRow[]>();
    for (const r of rows) {
      const k = r.rep_id || "Unknown";
      by.set(k, [...(by.get(k) ?? []), r]);
    }
    const out = [...by.entries()].map(([rep, rs]) => {
      const cov: Record<string, number | null> = {};
      for (const s of SECTIONS) {
        const reached = rs.filter((r) => r.coverage?.[s.key] && r.coverage[s.key] !== "not_reached");
        cov[s.key] = reached.length ? reached.filter((r) => r.coverage[s.key] === "asked").length / reached.length : null;
      }
      const billCaptured = rs.filter((r) => r.bill_flip === "flipped" || r.bill_flip === "not_flipped");
      const reasonGiven = rs.filter((r) => r.reason_used === "yes" || r.reason_used === "no");
      return {
        rep,
        calls: rs.length,
        cov,
        billCaptured: billCaptured.length,
        billFlipped: billCaptured.filter((r) => r.bill_flip === "flipped").length,
        reasonAsked: rs.filter((r) => r.reason_asked).length,
        reasonGiven: reasonGiven.length,
        reasonUsed: reasonGiven.filter((r) => r.reason_used === "yes").length,
        booked: rs.filter((r) => r.observed_outcome === "booked").length,
      };
    });
    return out.sort((a, b) => b.calls - a.calls);
  }, [rows]);

  const floor = useMemo(() => {
    const cov: Record<string, number | null> = {};
    for (const s of SECTIONS) {
      const reached = rows.filter((r) => r.coverage?.[s.key] && r.coverage[s.key] !== "not_reached");
      cov[s.key] = reached.length ? reached.filter((r) => r.coverage[s.key] === "asked").length / reached.length : null;
    }
    return cov;
  }, [rows]);

  const shown = reps.filter((r) => r.calls >= minCalls && r.rep !== "Unknown");
  const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)}`);

  // Funnel inputs from the same rows: floor, and every rep with enough calls.
  const funnel = useMemo(() => {
    const lastIdx = (r: TriageRow) =>
      FUNNEL_SECTIONS.reduce((m, s, i) => (r.coverage?.[s.key] === "asked" || r.coverage?.[s.key] === "skipped" ? i : m), -1);
    const build = (rs: TriageRow[]): FunnelInput => ({
      calls: rs.length,
      on_line: Object.fromEntries(FUNNEL_SECTIONS.map((s, i) => [s.key, rs.filter((r) => lastIdx(r) >= i).length])),
      sections: Object.fromEntries(
        FUNNEL_SECTIONS.map((s) => [
          s.key,
          {
            asked: rs.filter((r) => r.coverage?.[s.key] === "asked").length,
            skipped: rs.filter((r) => r.coverage?.[s.key] === "skipped").length,
            not_reached: rs.filter((r) => !r.coverage?.[s.key] || r.coverage[s.key] === "not_reached").length,
          },
        ])
      ),
    });
    const byRep: Record<string, FunnelInput> = {};
    for (const r of reps) if (r.calls >= minCalls && r.rep !== "Unknown") byRep[r.rep] = build(rows.filter((x) => (x.rep_id || "Unknown") === r.rep));
    return { floor: build(rows), byRep };
  }, [rows, reps, minCalls]);

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-stewart-muted">Where the calls go</p>
        <h1 className="text-xl sm:text-2xl font-bold mt-1">The script as a funnel.</h1>
        <div className="mt-3 rounded-lg border border-stewart-border bg-stewart-card p-4">
          <ScriptFunnel floor={funnel.floor} reps={funnel.byRep} compact />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-stewart-muted">The script, by rep</p>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">Who runs which part of the script.</h1>
          <p className="text-sm text-stewart-muted mt-1 leading-relaxed">
            Each cell: of that rep&apos;s calls that reached the section, the share where they ran it. Counts, not
            grades. Click a rep for their morning list.
          </p>
        </div>
        <label className="text-xs text-stewart-muted flex items-center gap-2">
          min calls
          <input type="range" min={1} max={20} value={minCalls} onChange={(e) => setMinCalls(Number(e.target.value))} className="accent-[#3b82f6]" />
          <span className="font-mono text-stewart-text w-5">{minCalls}</span>
        </label>
      </div>

      <div className="rounded-lg border border-stewart-border overflow-x-auto">
        <table className="text-xs min-w-[900px] w-full">
          <thead className="bg-stewart-card text-[10px] uppercase tracking-wider text-stewart-muted">
            <tr>
              <th className="text-left px-2 py-2 sticky left-0 bg-stewart-card">Rep</th>
              <th className="text-right px-2 py-2">Calls</th>
              {SECTIONS.map((s) => (
                <th key={s.key} className="px-1 py-2 text-center font-medium">{s.label}</th>
              ))}
              <th className="px-2 py-2 text-center text-stewart-warning">Bill used</th>
              <th className="px-2 py-2 text-center text-stewart-warning">Reason used</th>
              <th className="px-2 py-2 text-center">Booked</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-stewart-border bg-stewart-bg/60 font-semibold">
              <td className="px-2 py-1.5 sticky left-0 bg-stewart-bg/60">Floor</td>
              <td className="px-2 py-1.5 text-right font-mono">{rows.length}</td>
              {SECTIONS.map((s) => (
                <td key={s.key} className="px-1 py-1.5 text-center">
                  <span className={"inline-block min-w-[2.2rem] rounded px-1 py-0.5 font-mono " + cellTone(floor[s.key])}>{pct(floor[s.key])}</span>
                </td>
              ))}
              <td className="px-2 py-1.5 text-center font-mono">{reps.reduce((n, r) => n + r.billFlipped, 0)}/{reps.reduce((n, r) => n + r.billCaptured, 0)}</td>
              <td className="px-2 py-1.5 text-center font-mono">{reps.reduce((n, r) => n + r.reasonUsed, 0)}/{reps.reduce((n, r) => n + r.reasonGiven, 0)}</td>
              <td className="px-2 py-1.5 text-center font-mono">{reps.reduce((n, r) => n + r.booked, 0)}</td>
            </tr>
            {shown.map((r) => (
              <tr key={r.rep} className="border-t border-stewart-border/60 hover:bg-stewart-card/60">
                <td className="px-2 py-1.5 sticky left-0 bg-stewart-bg">
                  <button type="button" onClick={() => onPick(r.rep)} className="font-semibold hover:text-stewart-accent">{r.rep}</button>
                </td>
                <td className="px-2 py-1.5 text-right font-mono text-stewart-muted">{r.calls}</td>
                {SECTIONS.map((s) => (
                  <td key={s.key} className="px-1 py-1.5 text-center">
                    <span className={"inline-block min-w-[2.2rem] rounded px-1 py-0.5 font-mono " + cellTone(r.cov[s.key])}>{pct(r.cov[s.key])}</span>
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center font-mono">{r.billFlipped}/{r.billCaptured}</td>
                <td className="px-2 py-1.5 text-center font-mono">{r.reasonUsed}/{r.reasonGiven}</td>
                <td className="px-2 py-1.5 text-center font-mono">{r.booked}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-stewart-muted italic">
        {reps.length - shown.length > 0 ? `${reps.length - shown.length} rep(s) hidden below ${minCalls} calls. ` : ""}
        Measured by Stewart&apos;s read of each call against Ion&apos;s own setting script; &ldquo;ran it&rdquo; is any phrasing, not verbatim.
      </p>
    </div>
  );
}
