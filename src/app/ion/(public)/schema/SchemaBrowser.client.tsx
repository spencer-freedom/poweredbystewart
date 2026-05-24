"use client";

import { useMemo, useState } from "react";
import type {
  SchemaPayload,
  SchemaSection,
  ProposedCategory,
} from "./types";

type FilterKey = "all" | "tbd" | "resolved" | "gray_matter" | "pending";

const STATUS_BADGES: Record<
  string,
  { label: string; classes: string }
> = {
  resolved: {
    label: "✓ RESOLVED",
    classes: "border-stewart-success/50 text-stewart-success bg-stewart-success/10",
  },
  tbd: {
    label: "📝 TBD",
    classes: "border-stewart-warning/50 text-stewart-warning bg-stewart-warning/10",
  },
  lit: {
    label: "● LIT",
    classes: "border-stewart-accent/40 text-stewart-accent bg-stewart-accent/10",
  },
  stub: {
    label: "○ STUB",
    classes: "border-stewart-border text-stewart-muted bg-stewart-card",
  },
};

const PROPOSED_BADGE = {
  label: "🆕 PENDING",
  classes: "border-amber-400/50 text-amber-400 bg-amber-400/10",
};

const PROPOSED_ID_PREFIX = "proposed:";

type SelectableId = string; // either a real schema path OR "proposed:<name>"

export function SchemaBrowser({ payload }: { payload: SchemaPayload }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => groupByDomain(payload), [payload]);

  // Apply search + filter to top-level sections (proposed handled separately).
  const visibleByDomain = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out: Record<string, SchemaSection[]> = {};
    for (const [domain, sections] of Object.entries(grouped)) {
      const passing = sections.filter((s) => {
        if (filter === "tbd" && s.status !== "tbd") return false;
        if (filter === "resolved" && s.status !== "resolved") return false;
        if (
          filter === "gray_matter" &&
          !(s.corpus_stats?.gray_matter_exemplars?.length)
        )
          return false;
        if (filter === "pending") return false;
        if (q && !s.path.toLowerCase().includes(q)) return false;
        return true;
      });
      if (passing.length) out[domain] = passing;
    }
    return out;
  }, [grouped, filter, search]);

  const visibleProposed = useMemo(() => {
    if (filter === "tbd" || filter === "resolved" || filter === "gray_matter")
      return [];
    const q = search.trim().toLowerCase();
    return payload.proposed_categories.filter(
      (p) => !q || p.name.toLowerCase().includes(q)
    );
  }, [payload.proposed_categories, filter, search]);

  // Default selection: first section in first domain (or bombshell proposed)
  const firstSection =
    Object.values(visibleByDomain)[0]?.[0] || payload.sections[0] || null;
  const defaultSel: SelectableId | null = firstSection
    ? firstSection.path
    : payload.proposed_categories[0]
    ? `${PROPOSED_ID_PREFIX}${payload.proposed_categories[0].name}`
    : null;

  const [selectedId, setSelectedId] = useState<SelectableId | null>(defaultSel);

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      <Sidebar
        payload={payload}
        visibleByDomain={visibleByDomain}
        visibleProposed={visibleProposed}
        filter={filter}
        onFilter={setFilter}
        search={search}
        onSearch={setSearch}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <main className="lg:col-span-8 xl:col-span-9 min-w-0">
        <SelectedDetail
          selectedId={selectedId}
          payload={payload}
        />
      </main>
    </div>
  );
}

function groupByDomain(payload: SchemaPayload): Record<string, SchemaSection[]> {
  const map: Record<string, SchemaSection[]> = {};
  for (const s of payload.sections) {
    (map[s.domain] ||= []).push(s);
  }
  for (const list of Object.values(map)) {
    list.sort((a, b) => a.path.localeCompare(b.path));
  }
  // Order domains per payload.domain_order; trailing for any not in the list.
  const ordered: Record<string, SchemaSection[]> = {};
  const seen = new Set<string>();
  for (const d of payload.domain_order) {
    if (map[d]) {
      ordered[d] = map[d];
      seen.add(d);
    }
  }
  for (const [d, list] of Object.entries(map)) {
    if (!seen.has(d)) ordered[d] = list;
  }
  return ordered;
}

function Sidebar({
  payload,
  visibleByDomain,
  visibleProposed,
  filter,
  onFilter,
  search,
  onSearch,
  selectedId,
  onSelect,
}: {
  payload: SchemaPayload;
  visibleByDomain: Record<string, SchemaSection[]>;
  visibleProposed: ProposedCategory[];
  filter: FilterKey;
  onFilter: (f: FilterKey) => void;
  search: string;
  onSearch: (s: string) => void;
  selectedId: SelectableId | null;
  onSelect: (id: SelectableId) => void;
}) {
  return (
    <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
      <div className="rounded-lg border border-stewart-border bg-stewart-card p-3 space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Filter by section path…"
          className="w-full bg-stewart-bg border border-stewart-border rounded px-3 py-1.5 text-sm text-stewart-text placeholder:text-stewart-muted focus:border-stewart-accent focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "All"],
              ["tbd", `TBD (${payload.stats.tbds})`],
              ["resolved", `Resolved (${payload.stats.resolved})`],
              ["gray_matter", "Gray-matter"],
              ["pending", `New (${payload.stats.proposed_pending})`],
            ] as [FilterKey, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => onFilter(k)}
              className={
                "text-xs px-2 py-1 rounded border transition-colors " +
                (filter === k
                  ? "border-stewart-accent bg-stewart-accent/15 text-stewart-accent"
                  : "border-stewart-border bg-stewart-bg text-stewart-muted hover:text-stewart-text")
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <nav className="rounded-lg border border-stewart-border bg-stewart-card max-h-[70vh] overflow-y-auto">
        {Object.entries(visibleByDomain).map(([domain, sections]) => (
          <div
            key={domain}
            className="border-b border-stewart-border/60 last:border-b-0"
          >
            <p className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-stewart-muted bg-stewart-bg/30">
              {domain} &middot; {sections.length}
            </p>
            <ul>
              {sections.map((s) => (
                <li key={s.path}>
                  <button
                    onClick={() => onSelect(s.path)}
                    className={
                      "w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors " +
                      (selectedId === s.path
                        ? "bg-stewart-accent/15 border-l-2 border-stewart-accent"
                        : "hover:bg-stewart-bg/40 border-l-2 border-transparent")
                    }
                  >
                    <StatusDot status={s.status} />
                    <span className="font-mono truncate text-stewart-text">
                      {s.path.slice(domain.length + 1)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {visibleProposed.length ? (
          <div className="border-t-2 border-amber-400/40">
            <p className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-amber-400 bg-amber-400/5">
              🆕 Pending Kenny approval &middot; {visibleProposed.length}
            </p>
            <ul>
              {visibleProposed.map((p) => {
                const id = `${PROPOSED_ID_PREFIX}${p.name}`;
                return (
                  <li key={p.name}>
                    <button
                      onClick={() => onSelect(id)}
                      className={
                        "w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors " +
                        (selectedId === id
                          ? "bg-amber-400/15 border-l-2 border-amber-400"
                          : "hover:bg-stewart-bg/40 border-l-2 border-transparent")
                      }
                    >
                      {p.is_bombshell ? (
                        <span className="text-stewart-danger" aria-hidden>
                          ⚠
                        </span>
                      ) : (
                        <span className="text-amber-400" aria-hidden>
                          +
                        </span>
                      )}
                      <span className="font-mono text-stewart-text">
                        {p.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </nav>
    </aside>
  );
}

function StatusDot({ status }: { status: string }) {
  const c =
    status === "resolved"
      ? "bg-stewart-success"
      : status === "tbd"
      ? "bg-stewart-warning"
      : status === "lit"
      ? "bg-stewart-accent"
      : "bg-stewart-border";
  return <span className={`shrink-0 w-2 h-2 rounded-full ${c}`} aria-hidden />;
}

function SelectedDetail({
  selectedId,
  payload,
}: {
  selectedId: SelectableId | null;
  payload: SchemaPayload;
}) {
  if (!selectedId) {
    return (
      <p className="text-sm text-stewart-muted">
        Pick a section on the left.
      </p>
    );
  }
  if (selectedId.startsWith(PROPOSED_ID_PREFIX)) {
    const name = selectedId.slice(PROPOSED_ID_PREFIX.length);
    const p = payload.proposed_categories.find((c) => c.name === name);
    if (!p) return null;
    return <ProposedDetail proposed={p} />;
  }
  const section = payload.sections.find((s) => s.path === selectedId);
  if (!section) return null;
  return <SectionDetail section={section} />;
}

function SectionDetail({ section }: { section: SchemaSection }) {
  const badge = STATUS_BADGES[section.status] || STATUS_BADGES.stub;
  const stats = section.corpus_stats || {};
  const callCount = stats.call_count ?? 0;
  const classifications = Object.entries(stats.classifications || {}).sort(
    ([, a], [, b]) => b - a
  );
  const outcomes = Object.entries(stats.outcomes || {}).sort(
    ([, a], [, b]) => b - a
  );
  const grays = stats.gray_matter_exemplars || [];
  const examples = stats.recent_examples || [];

  return (
    <article className="space-y-7">
      <header className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <code className="text-base sm:text-lg font-mono text-stewart-accent break-all">
            {section.path}
          </code>
          <span
            className={
              "text-[10px] font-mono uppercase tracking-wider rounded px-2 py-0.5 border " +
              badge.classes
            }
          >
            {badge.label}
            {section.resolved_at ? <> · {section.resolved_at}</> : null}
          </span>
        </div>
      </header>

      {callCount > 0 ? (
        <section>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
            From your corpus
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded border border-stewart-border bg-stewart-card p-4">
              <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
                Calls referencing this section
              </p>
              <p className="text-2xl font-bold text-stewart-text">
                {callCount}
              </p>
              {classifications.length > 0 ? (
                <p className="text-xs text-stewart-muted mt-2">
                  Top pattern:{" "}
                  <span className="text-stewart-text">
                    {classifications[0][0].replace(/_/g, " ")}
                  </span>{" "}
                  ({classifications[0][1]})
                </p>
              ) : null}
            </div>
            <div className="rounded border border-stewart-border bg-stewart-card p-4">
              <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
                Outcome distribution
              </p>
              {outcomes.length === 0 ? (
                <p className="text-xs text-stewart-muted">—</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {outcomes.map(([k, n]) => (
                    <span
                      key={k}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-stewart-border bg-stewart-bg/50 text-stewart-muted"
                    >
                      {k.replace(/_/g, " ")}:{" "}
                      <span className="text-stewart-text">{n}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded border border-stewart-border bg-stewart-card p-4">
          <p className="text-xs text-stewart-muted">
            No calls in the processed corpus reference this section yet.
            That&apos;s normal for newer schema entries.
          </p>
        </section>
      )}

      {section.tbd_items.length > 0 ? (
        <section className="rounded border border-stewart-warning/40 bg-stewart-warning/5 p-4">
          <p className="text-xs uppercase tracking-wider text-stewart-warning mb-2">
            Pending Kenny &middot; {section.tbd_items.length} TBD
            {section.tbd_items.length > 1 ? "s" : ""}
          </p>
          <ul className="space-y-1 text-sm text-stewart-text">
            {section.tbd_items.map((t, i) => (
              <li key={i} className="font-mono text-xs leading-snug">
                {t}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {section.resolved_at ? (
        <section className="rounded border border-stewart-success/40 bg-stewart-success/5 p-4">
          <p className="text-xs uppercase tracking-wider text-stewart-success mb-2">
            Resolved {section.resolved_at}
          </p>
          <p className="text-sm text-stewart-text leading-relaxed">
            This section was a TBD until Kenny&apos;s direct call with
            Spencer on {section.resolved_at}. The schema entry below
            reflects the resolution &mdash; Stewart now reads every
            related call through this lens.
          </p>
        </section>
      ) : null}

      {grays.length > 0 ? (
        <section>
          <p className="text-xs uppercase tracking-wider text-amber-400 mb-2">
            Gray-matter exemplars
          </p>
          <ul className="space-y-2">
            {grays.map((g, i) => (
              <li
                key={i}
                className="rounded border border-amber-400/30 bg-amber-400/5 p-3 text-sm"
              >
                <code className="font-mono text-stewart-accent text-xs">
                  {g.call_id}
                </code>
                {g.reason ? (
                  <p className="text-xs text-stewart-text mt-1 leading-relaxed">
                    {g.reason}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {examples.length > 0 ? (
        <section>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
            Recent example cherry-picks
          </p>
          <ul className="space-y-3">
            {examples.slice(0, 5).map((ex, i) => (
              <li
                key={i}
                className="rounded border border-stewart-border bg-stewart-card p-3"
              >
                <p className="text-xs text-stewart-muted font-mono mb-1">
                  {ex.call_id} @ {ex.ts}{" "}
                  <span className="text-stewart-muted/70">
                    ({ex.classification.replace(/_/g, " ")})
                  </span>
                </p>
                <blockquote className="text-sm text-stewart-text italic leading-snug">
                  &ldquo;{ex.quote}&rdquo;
                </blockquote>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {section.raw_yaml ? <RawYamlToggle yaml={section.raw_yaml} /> : null}
    </article>
  );
}

function ProposedDetail({ proposed: p }: { proposed: ProposedCategory }) {
  const tone = p.is_bombshell
    ? "border-stewart-danger/50 bg-stewart-danger/5"
    : "border-amber-400/40 bg-amber-400/5";
  return (
    <article className={"space-y-6 rounded-lg border p-6 " + tone}>
      <header className="space-y-3">
        <span
          className={
            "text-[10px] font-mono uppercase tracking-wider rounded px-2 py-0.5 border " +
            (p.is_bombshell
              ? "border-stewart-danger/50 text-stewart-danger bg-stewart-danger/10"
              : PROPOSED_BADGE.classes)
          }
        >
          {p.is_bombshell ? "⚠ THE BOMBSHELL" : PROPOSED_BADGE.label}
        </span>
        <h2 className="text-2xl font-bold text-stewart-text leading-snug">
          <code className="font-mono text-stewart-accent">{p.name}</code>
        </h2>
        {p.spencers_catch ? (
          <p className="text-xs uppercase tracking-wider text-stewart-warning">
            Spencer&apos;s catch &middot; operator instinct
          </p>
        ) : null}
      </header>

      {p.is_bombshell && p.critical_finding ? (
        <div className="rounded border border-stewart-danger/50 bg-stewart-danger/10 p-4">
          <p className="text-base sm:text-lg text-stewart-text leading-snug">
            {p.critical_finding}
          </p>
        </div>
      ) : null}

      {p.description ? (
        <Section title="Description">{p.description}</Section>
      ) : null}

      {p.distinct_from ? (
        <Section
          title={`Distinct from "${p.distinct_from}"`}
        >
          {p.distinction || "—"}
        </Section>
      ) : null}

      {p.fix ? <Section title="The fix">{p.fix}</Section> : null}

      {p.coaching_drill ? (
        <Section title="Coaching drill">{p.coaching_drill}</Section>
      ) : null}

      {p.attribution ? (
        <Section title="Attribution">{p.attribution}</Section>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        {typeof p.sample_frequency_in_corpus === "number" ? (
          <Stat
            label="Detected in corpus (sample)"
            value={String(p.sample_frequency_in_corpus)}
            tone="warning"
          />
        ) : null}
        {typeof p.detected_in_corpus_actually_executed === "number" ? (
          <Stat
            label="Actually executed"
            value={String(p.detected_in_corpus_actually_executed)}
            tone={
              p.detected_in_corpus_actually_executed === 0 ? "danger" : "default"
            }
          />
        ) : null}
      </div>

      {p.corpus_data_2026_05_22 ? (
        <Section title="Corpus data · 2026-05-22">
          <ul className="text-xs font-mono space-y-1 text-stewart-text">
            {Object.entries(p.corpus_data_2026_05_22).map(([k, v]) => (
              <li key={k}>
                <span className="text-stewart-muted">{k}:</span>{" "}
                {String(v)}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {p.example_call_ids?.length ? (
        <Section title="Example calls">
          <ul className="text-xs font-mono space-y-1">
            {p.example_call_ids.map((e, i) => {
              const cid = typeof e === "string" ? e : e.call_id;
              const ts = typeof e === "string" ? undefined : e.ts;
              return (
                <li key={i} className="text-stewart-text">
                  <code className="text-stewart-accent">{cid}</code>
                  {ts ? <> @ {ts}</> : null}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      <div className="pt-4 border-t border-stewart-border">
        <p className="text-xs text-stewart-muted leading-relaxed">
          Kenny — approve / reject / refine? Walk through with Spencer in
          the next call. Stewart proposes; Kenny ratifies.
        </p>
      </div>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
        {title}
      </p>
      <div className="text-sm text-stewart-text leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "warning" | "danger";
}) {
  const cls =
    tone === "danger"
      ? "border-stewart-danger/50 text-stewart-danger"
      : tone === "warning"
      ? "border-stewart-warning/50 text-stewart-warning"
      : "border-stewart-border text-stewart-text";
  return (
    <div className={"rounded border bg-stewart-card p-3 " + cls}>
      <p className="text-[10px] uppercase tracking-wider text-stewart-muted mb-1">
        {label}
      </p>
      <p className="text-lg font-bold font-mono">{value}</p>
    </div>
  );
}

function RawYamlToggle({ yaml }: { yaml: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-stewart-accent hover:underline"
      >
        {open ? "− hide" : "+ expand"} raw YAML
      </button>
      {open ? (
        <pre className="mt-2 rounded border border-stewart-border bg-stewart-bg/60 p-4 overflow-x-auto text-[11px] font-mono text-stewart-text/80 leading-relaxed whitespace-pre">
          {yaml}
        </pre>
      ) : null}
    </section>
  );
}
