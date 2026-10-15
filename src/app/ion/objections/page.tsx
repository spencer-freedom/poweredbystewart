import { AudioClip } from "../(public)/_components/AudioClip.client";
import { Presence } from "../(public)/_components/Listen.client";
import { clipSrc } from "../call/clipSign";
import { loadRows, MOVE_LABEL, MOVE_VERB, OBJ_LABEL, SECTION_LABEL, words, type Row } from "../call/tape";

// /ion/objections — every objection the floor hears, and what got past it.
// Gated (every /ion path is): this is Ion's own tape, for a setter on that
// floor. Each objection once; under it, the moves that overcame it, ranked
// by how often they worked, and the tape of each, regardless of who said it.
// Built from the same reads as the three-call demo; nothing new is judged here.

export const dynamic = "force-dynamic";

type Obj = NonNullable<Row["objections"]>[number] & { attempt_quotes?: string[]; kinds?: string[]; restates?: number; next_event?: string | null; blocked_section?: string | null };
type Hit = { row: Row; o: Obj; worked: string; angles: number };
// What one moment card is given: words and two clip URLs. The read's own
// rows never cross into the rendered tree, in any build mode.
type MomentView = { rep: string; at: string; booked: boolean; label: string; said: string; where: string | null; tries: { who: string; how: string; same: boolean; said: string; then: string }[]; count: string; clip: string; whole: string };
const slug = (t: string) => (OBJ_LABEL[t] ?? words(t)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
function momentView(h: Hit): MomentView {
  const { row, o } = h;
  const rep = row.rep_id ?? "the rep";
  const quotes = o.attempt_quotes ?? [], moves = o.moves ?? [], kinds = o.kinds ?? [];
  const next = o.next_event && o.next_event.includes("@") ? o.next_event.split("@") : null;
  return {
    rep, at: o.ts ?? "", booked: row.booked,
    label: (OBJ_LABEL[o.type] ?? words(o.type)).toLowerCase(), said: o.quote,
    where: o.blocked_section ? SECTION_LABEL[o.blocked_section] ?? words(o.blocked_section) : null,
    tries: quotes.map((q, i) => ({ who: i === 0 ? rep : `Then ${rep}`, how: MOVE_VERB[moves[i] ?? "other"] ?? "tries something", same: kinds[i] === "restate", said: q, then: i === quotes.length - 1 ? "The customer moves." : "The customer holds." })),
    count: `${o.attempts} ${o.attempts === 1 ? "angle" : "angles"}${o.restates ? `, said it again \u00d7${o.restates}` : ""}${next ? `, and the script went on to ${SECTION_LABEL[next[0]] ?? words(next[0])} at ${next[1]}` : ""}.`,
    clip: clipSrc(row.call_id, o.start_sec!, o.end_sec!), whole: `/api/ion/audio-clip/${encodeURIComponent(row.call_id)}`,
  };
}

const ORDER = ["timing_or_callback", "trust_or_scam", "cost", "roof_or_home", "already_have_quote_or_system", "proposal_by_email", "spouse_or_co_decider", "not_interested", "other"];
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

export default function Objections() {
  const rows = loadRows();
  const byType: Record<string, { faced: number; set: number; hits: Hit[] }> = {};
  for (const row of rows) {
    for (const o of (row.objections ?? []) as Obj[]) {
      const t = (byType[o.type] ??= { faced: 0, set: 0, hits: [] });
      t.faced += 1; t.set += row.booked ? 1 : 0;
      // What worked: the objection was overcome on tape, and the last real move
      // the rep made (not a concession) is the one that got past it.
      if (!o.continued || o.attempts < 1 || o.start_sec === null || o.end_sec === null) continue;
      const moves = o.moves ?? [], kinds = o.kinds ?? [];
      let worked: string | null = null;
      for (let i = moves.length - 1; i >= 0; i--) if (moves[i] !== "concede" && kinds[i] !== "concede") { worked = moves[i]; break; }
      if (!worked) continue;
      t.hits.push({ row, o, worked, angles: o.attempts });
    }
  }
  const types = [...ORDER.filter((t) => byType[t]), ...Object.keys(byType).filter((t) => !ORDER.includes(t))];

  return (
    <main className="min-h-screen bg-black text-stewart-text">
      <Presence />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-xs uppercase tracking-[0.25em] text-stewart-accent font-semibold">Powered by Stewart · Ion</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold leading-tight">Every objection this floor hears, and what got past it.</h1>
        <p className="mt-3 max-w-2xl text-stewart-muted leading-relaxed">
          Each objection once. Under it, the moves that overcame it, ranked by how often they worked, and the tape of each one, whoever said it.
          Every clip runs from the no through to the script moving on. Read from {rows.length} calls; counts are counts, not opinions.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2 text-sm">
          {types.map((t) => (
            <li key={slug(t)}><a href={`#${slug(t)}`} className="inline-block rounded-full border border-stewart-border px-3 py-1 hover:border-stewart-accent/60">{OBJ_LABEL[t] ?? words(t)} <span className="text-stewart-muted">{byType[t].faced}</span></a></li>
          ))}
        </ul>

        {types.map((t) => {
          const d = byType[t];
          const groups: Record<string, Hit[]> = {};
          for (const h of d.hits) (groups[h.worked] ??= []).push(h);
          const ranked = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
          return (
            <section key={slug(t)} id={slug(t)} className="mt-14 scroll-mt-6">
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stewart-accent">{OBJ_LABEL[t] ?? words(t)}</p>
              <h2 className="mt-1 text-2xl font-bold">Came up {d.faced} times. The call still set {pct(d.set, d.faced)} of the time.</h2>
              {d.hits.length ? (
                <p className="mt-1 text-sm text-stewart-muted">Overcome on tape {d.hits.length} times, {d.hits.filter((h) => h.row.booked).length} of those booked. What worked, most often first:</p>
              ) : (
                <p className="mt-2 text-sm text-stewart-warning">Nobody on this floor has got past this one yet. When someone does, it shows up here.</p>
              )}
              {ranked.map(([move, hits]) => {
                const list = hits.sort((a, b) => Number(b.row.booked) - Number(a.row.booked) || b.angles - a.angles).slice(0, 6);
                return (
                  <div key={(MOVE_LABEL[move] ?? words(move)).replace(/\W+/g, "-")} className="mt-6 rounded-xl border border-stewart-border bg-stewart-card p-4">
                    <p className="text-sm font-semibold">
                      <span style={{ color: "#f59e0b" }}>{(MOVE_LABEL[move] ?? words(move)).replace(/^./, (c) => c.toUpperCase())}</span>
                      <span className="text-stewart-muted"> · worked {hits.length} {hits.length === 1 ? "time" : "times"}, {hits.filter((h) => h.row.booked).length} booked</span>
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {list.map((h, i) => <Moment key={i} m={momentView(h)} />)}
                    </div>
                    {hits.length > list.length ? <p className="mt-2 text-xs text-stewart-muted">{hits.length - list.length} more on the tape.</p> : null}
                  </div>
                );
              })}
            </section>
          );
        })}

        <p className="mt-16 border-t border-white/10 pt-6 text-sm text-stewart-muted">Rep names are the floor&apos;s own. Whole-call audio opens the full recording the moment came from.</p>
      </div>
    </main>
  );
}

// One moment: the no, what the rep tried, and the script moving on. Same
// sentences as the three-call demo's training sequence, overcome form.
function Moment({ m }: { m: MomentView }) {
  return (
    <div className={"rounded-lg border p-3 text-sm leading-relaxed " + (m.booked ? "border-stewart-success/40 bg-stewart-success/5" : "border-stewart-border bg-black/30")}>
      <p className="text-[11px] uppercase tracking-wider text-stewart-muted">{m.rep} &middot; {m.at}{m.booked ? <span className="text-stewart-success"> &middot; booked</span> : <span> &middot; script went on, no set</span>}</p>
      <p className="mt-1">The customer stalls on {m.label}: &ldquo;{m.said}&rdquo;{m.where ? ` \u2014 right at ${m.where}` : ""}.</p>
      <p className="mt-1">
        {m.tries.map((t, i) => <span key={i}>{t.who} {t.how}{t.same ? " (the same line)" : ""}: &ldquo;{t.said}&rdquo; {t.then} </span>)}
        <span className="text-stewart-muted">{m.count}</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <AudioClip src={m.clip} label="Play it" />
        <AudioClip src={m.whole} label="Whole call" variant="full" />
      </div>
    </div>
  );
}
