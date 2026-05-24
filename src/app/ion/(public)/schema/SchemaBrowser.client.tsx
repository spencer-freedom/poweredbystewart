"use client";

import { useMemo, useState } from "react";
import type {
  CardStatus,
  HeroOverridesFile,
  ProposedCategory,
  SchemaPayload,
  SchemaSection,
} from "./types";
import { effectiveCardStatus } from "./types";
import { ProposedCard, SchemaCard } from "./SchemaCard.client";
import {
  SchemaDrawer,
  type SchemaDrawerSelection,
} from "./SchemaDrawer.client";
import {
  SchemaStatusDot,
  SchemaStatusPill,
} from "./SchemaStatusPill.client";

// V1 schema browser. Replaces the V0 sidebar + detail-pane layout
// with a status-pill counter + filter bar above a card grid grouped
// by domain. Each card opens a side drawer for the depth view (the
// pre-V1 SectionDetail / ProposedDetail render moved into
// SchemaDrawer.client.tsx — same behavior, new entry point).

type FilterKey = "all" | "lit" | "tbd" | "proposed" | "scaffolded";

export function SchemaBrowser({
  payload,
  overrides,
}: {
  payload: SchemaPayload;
  overrides: HeroOverridesFile;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<SchemaDrawerSelection | null>(null);

  // Card-counts (live from payload) — drive the counter line + filter
  // chip labels. Computed once; the visible-filter pass runs against
  // them.
  const counts = useMemo(() => countByCardStatus(payload), [payload]);

  const groupedSections = useMemo(
    () => groupSectionsByDomain(payload),
    [payload]
  );

  // Apply search + filter to sections. Proposed is filtered
  // separately because it lives on a different payload field.
  const visibleByDomain = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out: Record<string, SchemaSection[]> = {};
    for (const [domain, sections] of Object.entries(groupedSections)) {
      const passing = sections.filter((s) => {
        const cs = effectiveCardStatus(s);
        if (filter !== "all" && filter !== "proposed" && cs !== filter)
          return false;
        if (filter === "proposed") return false;
        if (q && !s.path.toLowerCase().includes(q)) return false;
        return true;
      });
      if (passing.length) out[domain] = passing;
    }
    return out;
  }, [groupedSections, filter, search]);

  const visibleProposed = useMemo(() => {
    if (filter !== "all" && filter !== "proposed") return [];
    const q = search.trim().toLowerCase();
    return payload.proposed_categories.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
    );
  }, [payload.proposed_categories, filter, search]);

  return (
    <div className="space-y-6">
      <SoWCounter counts={counts} />

      <FilterBar
        filter={filter}
        onFilter={setFilter}
        search={search}
        onSearch={setSearch}
        counts={counts}
      />

      {/* Proposed cards live in their own pinned group above the
          domain-grouped sections — they're "the bombshell pile"
          and deserve prominence. */}
      {visibleProposed.length > 0 ? (
        <DomainGroup
          title="Proposed · awaiting Kenny"
          count={visibleProposed.length}
          tone="proposed"
        >
          {visibleProposed.map((p) => (
            <ProposedCard
              key={p.name}
              proposed={p}
              onOpen={() => setDrawer({ kind: "proposed", proposed: p })}
            />
          ))}
        </DomainGroup>
      ) : null}

      {Object.entries(visibleByDomain).map(([domain, sections]) => (
        <DomainGroup
          key={domain}
          title={domain.replace(/_/g, " ")}
          count={sections.length}
        >
          {sections.map((section) => (
            <SchemaCard
              key={section.path}
              section={section}
              override={overrides[section.path]}
              onOpen={() => setDrawer({ kind: "section", section })}
            />
          ))}
        </DomainGroup>
      ))}

      {Object.keys(visibleByDomain).length === 0 &&
      visibleProposed.length === 0 ? (
        <p className="text-sm text-stewart-muted py-8 text-center">
          No sections match your filter.
        </p>
      ) : null}

      <SchemaDrawer selection={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}

// ---------------------------------------------------------------
// SoW counter line — the headline of the page. Live numbers from
// the payload, one sentence, no slop.
// ---------------------------------------------------------------

function SoWCounter({
  counts,
}: {
  counts: ReturnType<typeof countByCardStatus>;
}) {
  return (
    <div className="rounded-lg border border-stewart-border bg-stewart-card p-4 sm:p-5">
      <p className="text-sm sm:text-base text-stewart-text leading-relaxed">
        <CounterChip tone="lit" n={counts.lit} label="live" />
        <span className="text-stewart-muted"> · </span>
        <CounterChip tone="tbd" n={counts.tbd} label="to fill" />
        <span className="text-stewart-muted"> · </span>
        <CounterChip
          tone="proposed"
          n={counts.proposed}
          label="proposed"
        />
        <span className="text-stewart-muted"> · </span>
        <CounterChip
          tone="scaffolded"
          n={counts.scaffolded}
          label="scaffolded"
        />
        <span className="text-stewart-muted">
          {" "}
          — {counts.total.toLocaleString()} sections mapped, embedded build
          fills the scaffolding
        </span>
      </p>
    </div>
  );
}

function CounterChip({
  tone,
  n,
  label,
}: {
  tone: CardStatus | "proposed";
  n: number;
  label: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <SchemaStatusDot tone={tone} />
      <span className="font-mono text-stewart-text">{n.toLocaleString()}</span>
      <span className="text-stewart-muted">{label}</span>
    </span>
  );
}

// ---------------------------------------------------------------
// Filter + search bar. Sticky on scroll so the user can re-filter
// without scrolling back to the top.
// ---------------------------------------------------------------

function FilterBar({
  filter,
  onFilter,
  search,
  onSearch,
  counts,
}: {
  filter: FilterKey;
  onFilter: (f: FilterKey) => void;
  search: string;
  onSearch: (s: string) => void;
  counts: ReturnType<typeof countByCardStatus>;
}) {
  const pills: Array<{ key: FilterKey; label: string; tone?: CardStatus | "proposed" }> = [
    { key: "all", label: `All · ${counts.total.toLocaleString()}` },
    { key: "lit", label: `Live · ${counts.lit}`, tone: "lit" },
    { key: "tbd", label: `TBD · ${counts.tbd}`, tone: "tbd" },
    { key: "proposed", label: `Proposed · ${counts.proposed}`, tone: "proposed" },
    { key: "scaffolded", label: `Scaffolded · ${counts.scaffolded}`, tone: "scaffolded" },
  ];
  return (
    <div className="sticky top-0 z-30 -mx-2 px-2 py-3 bg-stewart-bg/95 backdrop-blur border-b border-stewart-border/40 flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
        {pills.map((p) => {
          const active = filter === p.key;
          return (
            <button
              key={p.key}
              onClick={() => onFilter(p.key)}
              className={
                "text-xs px-2.5 py-1 rounded border transition-colors flex items-center gap-1.5 " +
                (active
                  ? "border-stewart-accent bg-stewart-accent/15 text-stewart-accent"
                  : "border-stewart-border bg-stewart-card text-stewart-muted hover:text-stewart-text")
              }
            >
              {p.tone ? <SchemaStatusDot tone={p.tone} /> : null}
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>
      <input
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Filter by section path…"
        className="w-full sm:w-64 bg-stewart-card border border-stewart-border rounded px-3 py-1.5 text-sm text-stewart-text placeholder:text-stewart-muted focus:border-stewart-accent focus:outline-none"
      />
    </div>
  );
}

// ---------------------------------------------------------------
// Domain group — sticky header above its cards. Title styled to
// match /ion/calls' domain headers.
// ---------------------------------------------------------------

function DomainGroup({
  title,
  count,
  tone,
  children,
}: {
  title: string;
  count: number;
  tone?: "proposed";
  children: React.ReactNode;
}) {
  return (
    <section>
      <header
        className={
          "sticky top-14 z-20 -mx-2 px-2 py-2 mb-3 flex items-center gap-3 bg-stewart-bg/95 backdrop-blur border-b " +
          (tone === "proposed"
            ? "border-sky-400/30"
            : "border-stewart-border/40")
        }
      >
        <h2
          className={
            "text-xs uppercase tracking-wider font-semibold " +
            (tone === "proposed" ? "text-sky-400" : "text-stewart-accent")
          }
        >
          {title}
        </h2>
        <span className="text-xs font-mono text-stewart-muted">
          · {count.toLocaleString()}
        </span>
        {tone === "proposed" ? (
          <SchemaStatusPill tone="proposed" label="PENDING" />
        ) : null}
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {children}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function countByCardStatus(payload: SchemaPayload) {
  let lit = 0;
  let tbd = 0;
  let scaffolded = 0;
  for (const s of payload.sections) {
    const cs = effectiveCardStatus(s);
    if (cs === "lit") lit++;
    else if (cs === "tbd") tbd++;
    else if (cs === "scaffolded") scaffolded++;
  }
  const proposed = payload.proposed_categories.length;
  const total = lit + tbd + scaffolded + proposed;
  return { lit, tbd, scaffolded, proposed, total };
}

function groupSectionsByDomain(
  payload: SchemaPayload
): Record<string, SchemaSection[]> {
  const map: Record<string, SchemaSection[]> = {};
  for (const s of payload.sections) {
    (map[s.domain] ||= []).push(s);
  }
  // Within a domain, sort LIT first, then TBD, then SCAFFOLDED — the
  // brief's intent: scaffolding fills space behind the focal cards.
  // Tied status sorts alphabetically by path.
  const order: Record<CardStatus, number> = { lit: 0, tbd: 1, scaffolded: 2 };
  for (const list of Object.values(map)) {
    list.sort((a, b) => {
      const oa = order[effectiveCardStatus(a)];
      const ob = order[effectiveCardStatus(b)];
      if (oa !== ob) return oa - ob;
      return a.path.localeCompare(b.path);
    });
  }
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

// _unused exports — ProposedCategory + ProposedCard's prop type are
// pulled implicitly via the children; this comment marks where to
// extend if future cards need their own card component.
export type { ProposedCategory };
