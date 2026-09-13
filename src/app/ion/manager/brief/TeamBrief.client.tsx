"use client";

import { useEffect, useMemo, useState } from "react";
import { AudioClip, tsToSeconds } from "../../(public)/_components/AudioClip.client";
import { CallDetailDrawer } from "../../(public)/calls/CallDetailDrawer.client";
import { FUNNEL_SECTIONS, ScriptFunnel, type FunnelInput } from "../../present/_components/ScriptFunnel.client";
import type { ExemplarClip, TriageComponents, TriageIndex, TriageRow } from "../types";
import { NowPlaying, useBriefPlayer, type Segment } from "./BriefPlayer.client";

// The morning brief, organized the way a manager thinks: my team, one rep
// at a time. For each rep — the one call to train on today (highest
// triage score, not yet coached), their recent calls one tap away, and
// how they're running the script (their funnel against the floor's, and
// the sections they run least). Built for a phone; the deck embeds it in
// a phone frame. Everything is ranked from the corpus, nothing hand-picked.

const COACHED_KEY = "stewart-ion-coached";      // shared with /ion/manager
const CLIP_LEAD = 5;
const CLIP_LEN = 22;
const TEAM_MIN_CALLS = 5;

const WEIGHT_KEYS: (keyof TriageComponents)[] = ["leak", "fragile", "protocol", "bill", "signals"];
const scoreOf = (r: TriageRow, w: TriageComponents) => WEIGHT_KEYS.reduce((s, k) => s + w[k] * r.components[k], 0);
const isSet = (r: TriageRow) => r.observed_outcome === "booked" || r.observed_outcome === "tentative";

function flagOf(r: TriageRow): { label: string; cls: string } {
  if (r.booked && r.unresolved_concerns >= 1) return { label: "Booked · fragile", cls: "text-stewart-accent" };
  if (r.shape === "energy_built") return { label: "Share with the team", cls: "text-stewart-success" };
  if (r.booked) return { label: "Booked", cls: "text-stewart-success" };
  if (r.shape === "stagnant") return { label: "Stalled", cls: "text-stewart-danger" };
  return { label: "Recover", cls: "text-stewart-warning" };
}

function funnelOf(rs: TriageRow[]): FunnelInput {
  const lastIdx = (r: TriageRow) =>
    FUNNEL_SECTIONS.reduce((m, s, i) => (r.coverage?.[s.key] === "asked" || r.coverage?.[s.key] === "skipped" ? i : m), -1);
  return {
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
  };
}

// Run-rate among calls that reached the section.
function runRate(rs: TriageRow[], key: string): number | null {
  const ran = rs.filter((r) => r.coverage?.[key] === "asked").length;
  const reached = ran + rs.filter((r) => r.coverage?.[key] === "skipped").length;
  return reached ? ran / reached : null;
}

// What Stewart says before each clip. Short, plain, in the manager's ear.
function narrationFor(rep: string, calls: number, set: number, r: TriageRow, pos: number, total: number): string {
  const lead = pos === 0 ? `Good morning. ${total} reps, one call each. First up, ${rep}.` : pos === total - 1 ? `Last one. ${rep}.` : `Next, ${rep}.`;
  const flag = r.booked && r.unresolved_concerns ? "booked, but fragile" : r.shape === "stagnant" ? "stalled" : r.shape === "energy_built" ? "a good one to share" : "worth recovering";
  const head = (r.headline || r.focus?.topic || "").replace(/\s+/g, " ").trim();
  const why = (r.why || "").replace(/\s+/g, " ").trim();
  return `${lead} ${calls} calls read, ${set} set. Today's call is ${flag}: ${head}. ${why} Here's the moment${r.focus?.ts ? `, at ${r.focus.ts.replace(":", " ")}` : ""}.`;
}

export function TeamBrief({ index }: { index: TriageIndex }) {
  const weights = index.default_weights;
  const player = useBriefPlayer();
  const [coached, setCoached] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<TriageRow | null>(null);
  const [expanded, setExpanded] = useState<Record<string, "calls" | "script" | null>>({});

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
      try { localStorage.setItem(COACHED_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });

  const rows = useMemo(() => index.calls.map((r) => ({ ...r, score: scoreOf(r, weights) })), [index.calls, weights]);
  const floorFunnel = useMemo(() => funnelOf(rows), [rows]);
  const floorRates = useMemo(() => Object.fromEntries(FUNNEL_SECTIONS.map((s) => [s.key, runRate(rows, s.key)])), [rows]);

  const team = useMemo(() => {
    const by = new Map<string, TriageRow[]>();
    for (const r of rows) {
      const k = r.rep_id || "Unknown";
      if (k === "Unknown") continue;
      by.set(k, [...(by.get(k) ?? []), r]);
    }
    return [...by.entries()]
      .filter(([, rs]) => rs.length >= TEAM_MIN_CALLS)
      .map(([rep, rs]) => {
        const ranked = [...rs].sort((a, b) => b.score - a.score);
        const today = ranked.find((r) => !coached.has(r.call_id)) ?? null;
        const gaps = FUNNEL_SECTIONS.filter((s) => s.key !== "appointment_set")
          .map((s) => {
            const mine = runRate(rs, s.key);
            const floor = floorRates[s.key];
            const reached = rs.filter((r) => r.coverage?.[s.key] === "asked" || r.coverage?.[s.key] === "skipped").length;
            return mine !== null && floor !== null && reached >= 3 ? { ...s, gap: floor - mine, mine, floor } : null;
          })
          .filter((g): g is NonNullable<typeof g> => g !== null && g.gap > 0.1)
          .sort((a, b) => b.gap - a.gap)
          .slice(0, 3);
        // Learn from: for each gap, the teammate who runs that section most
        // (and sets when they do), with their clip — or the floor's best clip.
        const learn = gaps.map((g) => {
          const sec = index.exemplars?.[g.key];
          const best = sec?.best_reps.find((b) => b.rep !== rep) ?? null;
          const others = (sec?.clips ?? []).filter((c) => c.rep !== rep);
          const clip: ExemplarClip | null = (best && others.find((c) => c.rep === best.rep)) || others[0] || null;
          return { ...g, best, clip };
        });
        return {
          rep, rs, ranked, today,
          set: rs.filter(isSet).length,
          coachedCount: rs.filter((r) => coached.has(r.call_id)).length,
          gaps: learn,
          funnel: funnelOf(rs),
        };
      })
      .sort((a, b) => (b.today?.score ?? 0) - (a.today?.score ?? 0));
  }, [rows, coached, floorRates, index.exemplars]);

  const totalToday = team.filter((t) => t.today).length;
  const listening = Math.max(1, Math.round((totalToday * CLIP_LEN) / 60));

  // The brief as audio: for each rep with a call today, Stewart's line, then the tape.
  const withToday = team.filter((t) => t.today);
  const segmentsFor = (t: (typeof team)[number], pos: number, total: number): Segment[] => {
    const r = t.today!;
    const ts = r.focus?.ts ?? null;
    const segs: Segment[] = [{ kind: "say", text: narrationFor(t.rep, t.rs.length, t.set, r, pos, total), label: `${t.rep} — ${r.headline || r.focus?.topic || "today's call"}` }];
    if (ts) {
      const start = Math.max(0, tsToSeconds(ts) - CLIP_LEAD);
      segs.push({ kind: "clip", callId: r.call_id, start, end: start + CLIP_LEN, label: `${t.rep} at ${ts}` });
    } else {
      segs.push({ kind: "full", callId: r.call_id, label: `${t.rep} — the call` });
    }
    const g = t.gaps[0];
    if (g?.best && g.clip) {
      const who = g.clip.rep === g.best.rep ? g.best.rep : `${g.clip.rep}, one of the floor's best runs`;
      segs.push({
        kind: "say",
        label: `${t.rep} — learn from ${g.best.rep}`,
        text: `Where to take ${t.rep} next: ${g.label.toLowerCase()}. ${t.rep} runs it on ${Math.round(g.mine * 100)} percent of calls that reach it. ${g.best.rep} runs it on ${Math.round(g.best.rate * 100)} percent${g.best.set_rate_when_ran !== null ? ` and sets ${Math.round(g.best.set_rate_when_ran * 100)} percent when they do` : ""}. Here's ${who}, at ${g.clip.ts.replace(":", " ")}.`,
      });
      segs.push({ kind: "clip", callId: g.clip.call_id, start: g.clip.start_sec, end: g.clip.end_sec, label: `${g.clip.rep} — ${g.label}` });
    }
    return segs;
  };
  const playAll = () => player.start(withToday.flatMap((t, i) => segmentsFor(t, i, withToday.length)));
  const playRep = (t: (typeof team)[number]) => player.start(segmentsFor(t, 1, 3));

  return (
    <div className="mx-auto max-w-md px-4 py-5">
      <header className="mb-4">
        <p className="text-[11px] uppercase tracking-wider text-stewart-muted">Your team this morning</p>
        <h1 className="text-lg font-bold text-stewart-text mt-0.5 leading-snug">
          {team.length} reps. One call each worth your time.
        </h1>
        <p className="text-xs text-stewart-muted mt-1">
          {index.total_calls} calls read · {totalToday} to coach today · ~{listening} min of listening
        </p>
        {withToday.length ? (
          <button
            type="button"
            onClick={playAll}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-stewart-accent px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
            Play the brief
            <span className="text-xs font-normal text-white/80">— Stewart reads it, the tape plays</span>
          </button>
        ) : null}
      </header>

      <ul className="space-y-3">
        {team.map((t) => {
          const mode = expanded[t.rep] ?? null;
          const today = t.today;
          const flag = today ? flagOf(today) : null;
          const ts = today?.focus?.ts ?? null;
          const start = ts ? Math.max(0, tsToSeconds(ts) - CLIP_LEAD) : null;
          return (
            <li key={t.rep} className="rounded-lg border border-stewart-border bg-stewart-card">
              {/* Rep header — the manager's one-line read on this rep */}
              <div className="px-3.5 pt-3 pb-2 flex items-baseline justify-between gap-2">
                <span className="text-sm font-bold text-stewart-text">{t.rep}</span>
                <span className="text-[11px] font-mono text-stewart-muted">
                  {t.rs.length} calls · {t.set} set ({Math.round((100 * t.set) / t.rs.length)}%)
                </span>
              </div>

              {/* The one call to train on today */}
              {today ? (
                <div className="px-3.5 pb-3">
                  <p className="text-[10px] uppercase tracking-wider text-stewart-muted">Train on today</p>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <p className={"text-[11px] uppercase tracking-wider font-medium " + flag!.cls}>{flag!.label}</p>
                    <span className="text-[11px] font-mono text-stewart-muted">{today.duration_min ? `${Math.round(today.duration_min)} min · ` : ""}{ts ?? ""}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-stewart-text leading-snug">{today.headline || today.focus?.topic || "Open the read"}</p>
                  <p className="mt-1 text-xs text-stewart-muted leading-relaxed">{today.why}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => playRep(t)}
                      title="Stewart reads this one, then plays the moment"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-stewart-accent/50 bg-stewart-accent/10 text-[11px] font-semibold text-stewart-accent hover:bg-stewart-accent/20"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
                      Play
                    </button>
                    {start !== null ? (
                      <AudioClip callId={today.call_id} startSec={start} endSec={start + CLIP_LEN} label="Play the moment" />
                    ) : (
                      <AudioClip callId={today.call_id} variant="full" label="Play the call" />
                    )}
                    <button type="button" onClick={() => setOpen(today)} className="px-2.5 py-1.5 rounded border border-stewart-border text-[11px] text-stewart-muted hover:text-stewart-text hover:border-stewart-accent/40">
                      Full read →
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCoached(today.call_id)}
                      className="px-2.5 py-1.5 rounded border border-stewart-border text-[11px] text-stewart-muted hover:text-stewart-text"
                    >
                      Mark as coached
                    </button>
                  </div>
                </div>
              ) : (
                <p className="px-3.5 pb-3 text-xs text-stewart-success">All of {t.rep}&apos;s flagged calls are coached.</p>
              )}

              {/* Where a manager goes next */}
              <div className="border-t border-stewart-border grid grid-cols-2 divide-x divide-stewart-border">
                <button
                  type="button"
                  onClick={() => setExpanded((e) => ({ ...e, [t.rep]: mode === "calls" ? null : "calls" }))}
                  className={"px-3 py-2 text-[11px] font-medium text-left flex items-center justify-between " + (mode === "calls" ? "text-stewart-accent" : "text-stewart-muted hover:text-stewart-text")}
                >
                  Recent calls <span aria-hidden>{mode === "calls" ? "▴" : "▾"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded((e) => ({ ...e, [t.rep]: mode === "script" ? null : "script" }))}
                  className={"px-3 py-2 text-[11px] font-medium text-left flex items-center justify-between " + (mode === "script" ? "text-stewart-accent" : "text-stewart-muted hover:text-stewart-text")}
                >
                  How {t.rep} runs the script <span aria-hidden>{mode === "script" ? "▴" : "▾"}</span>
                </button>
              </div>

              {mode === "calls" ? (
                <ul className="border-t border-stewart-border divide-y divide-stewart-border/60">
                  {t.ranked.slice(0, 8).map((r) => {
                    const f = flagOf(r);
                    const done = coached.has(r.call_id);
                    return (
                      <li key={r.call_id} className={"px-3.5 py-2 " + (done ? "opacity-60" : "")}>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className={"text-[10px] uppercase tracking-wider font-medium " + f.cls}>{f.label}{done ? " · coached" : ""}</span>
                          <span className="text-[10px] font-mono text-stewart-muted">{r.score.toFixed(1)}</span>
                        </div>
                        <button type="button" onClick={() => setOpen(r)} className="mt-0.5 text-left text-xs text-stewart-text hover:text-stewart-accent leading-snug">
                          {r.headline || r.focus?.topic || r.call_id}
                        </button>
                      </li>
                    );
                  })}
                  {t.ranked.length > 8 ? <li className="px-3.5 py-2 text-[10px] text-stewart-muted">+{t.ranked.length - 8} more in the manager view</li> : null}
                </ul>
              ) : null}

              {mode === "script" ? (
                <div className="border-t border-stewart-border px-3.5 py-3 space-y-3">
                  {t.gaps.length ? (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-stewart-muted mb-1">Runs these least, vs. the floor</p>
                      <ul className="space-y-1">
                        {t.gaps.map((g) => (
                          <li key={g.key} className="text-xs">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-stewart-text">{g.short === "Bill $" ? "Bill amount" : g.label}</span>
                              <span className="font-mono text-stewart-warning">{Math.round(g.mine * 100)}% <span className="text-stewart-muted">vs {Math.round(g.floor * 100)}%</span></span>
                            </div>
                            {g.best ? (
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-stewart-muted">
                                <span>
                                  Learn from <span className="font-semibold text-stewart-accent">{g.best.rep}</span> — {Math.round(g.best.rate * 100)}%
                                  {g.best.set_rate_when_ran !== null ? <>, sets {Math.round(g.best.set_rate_when_ran * 100)}%</> : null}
                                </span>
                                {g.clip ? (
                                  <button
                                    type="button"
                                    onClick={() => player.start([{ kind: "clip", callId: g.clip!.call_id, start: g.clip!.start_sec, end: g.clip!.end_sec, label: `${g.clip!.rep} — ${g.label}` }])}
                                    className="inline-flex items-center gap-1 rounded border border-stewart-border px-1.5 py-0.5 text-[10px] text-stewart-text hover:border-stewart-accent/50"
                                    title={`${g.clip.rep} at ${g.clip.ts}: “${g.clip.quote}”`}
                                  >
                                    ▶ {g.clip.rep} at {g.clip.ts}
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-xs text-stewart-success">Runs every section at or above the floor.</p>
                  )}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-stewart-muted mb-1">{t.rep}&apos;s calls, through the script</p>
                    <ScriptFunnel floor={t.funnel} compact />
                  </div>
                  <p className="text-[10px] text-stewart-muted">Floor: {floorFunnel.calls} calls. Counts, not grades.</p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-5 text-[10px] text-stewart-muted italic leading-relaxed">
        Ranked from every call Stewart read. Reps with fewer than {TEAM_MIN_CALLS} calls aren&apos;t shown here yet.
      </p>

      <NowPlaying player={player} />

      {open ? (
        <CallDetailDrawer
          callId={open.call_id}
          summary={{
            call_id: open.call_id, rep_id: open.rep_id, outcome: open.outcome, duration_min: open.duration_min ?? 0,
            demo_role: null, primary_objection: null, cherrypick_count: open.counts.moments, top_classifications: [],
            schema_references: [], aging_tier: "hot", is_hero: open.is_hero, tagline: open.tagline,
            is_gray_matter: false, gray_matter_section: null, has_handoff: open.booked,
          }}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
