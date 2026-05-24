"use client";

import { useMemo, useState } from "react";
import type { CallsIndex, CallSummary } from "./types";
import { CallDetailDrawer } from "./CallDetailDrawer.client";

type TierFilter = "all" | "hero" | "gray_matter" | "standard";

const OUTCOME_BUCKETS = [
  { key: "all", label: "All" },
  { key: "booked", label: "Booked" },
  { key: "no_interest", label: "No interest" },
  { key: "callback", label: "Callback" },
  { key: "tentative", label: "Tentative" },
  { key: "declined", label: "Declined" },
] as const;

type OutcomeBucket = (typeof OUTCOME_BUCKETS)[number]["key"];

function bucketOf(outcome: string | null): OutcomeBucket {
  const o = (outcome || "").toLowerCase();
  if (o === "booked" || o === "appointment_set" || o === "transferred_to_closer")
    return "booked";
  if (o.startsWith("tentative")) return "tentative";
  if (o === "callback" || o === "conditional_booking") return "callback";
  if (o === "no_interest") return "no_interest";
  if (o === "declined" || o === "unqualified") return "declined";
  return "all";
}

function bucketTone(b: OutcomeBucket): string {
  switch (b) {
    case "booked":
      return "text-stewart-success";
    case "tentative":
      return "text-stewart-warning";
    case "callback":
      return "text-stewart-accent";
    case "no_interest":
    case "declined":
      return "text-stewart-danger";
    default:
      return "text-stewart-muted";
  }
}

export function CallsBrowser({ index }: { index: CallsIndex }) {
  const [search, setSearch] = useState("");
  const [outcomeBucket, setOutcomeBucket] = useState<OutcomeBucket>("all");
  const [rep, setRep] = useState<string>("__all__");
  const [pattern, setPattern] = useState<string>("__all__");
  const [tier, setTier] = useState<TierFilter>("all");
  const [drawerCallId, setDrawerCallId] = useState<string | null>(null);

  // Derive filter option lists
  const repOptions = useMemo(() => {
    const reps = new Map<string, number>();
    for (const c of index.calls) {
      const r = c.rep_id || "(unknown)";
      reps.set(r, (reps.get(r) || 0) + 1);
    }
    return Array.from(reps.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [index]);

  const patternOptions = useMemo(() => {
    const pats = new Map<string, number>();
    for (const c of index.calls) {
      for (const p of c.top_classifications || []) {
        pats.set(p, (pats.get(p) || 0) + 1);
      }
    }
    return Array.from(pats.entries()).sort(([, a], [, b]) => b - a);
  }, [index]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return index.calls.filter((c) => {
      if (tier === "hero" && !c.is_hero) return false;
      if (tier === "gray_matter" && !c.is_gray_matter) return false;
      if (tier === "standard" && c.is_hero) return false;
      if (outcomeBucket !== "all" && bucketOf(c.outcome) !== outcomeBucket)
        return false;
      if (rep !== "__all__" && (c.rep_id || "(unknown)") !== rep) return false;
      if (
        pattern !== "__all__" &&
        !(c.top_classifications || []).includes(pattern)
      )
        return false;
      if (q) {
        const hay =
          (c.call_id || "") +
          " " +
          (c.rep_id || "") +
          " " +
          (c.primary_objection || "") +
          " " +
          (c.tagline || "") +
          " " +
          (c.top_classifications || []).join(" ") +
          " " +
          (c.codex_references || []).join(" ");
        if (!hay.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [index, search, outcomeBucket, rep, pattern, tier]);

  const heroFiltered = filtered.filter((c) => c.is_hero);
  const standardFiltered = filtered.filter((c) => !c.is_hero);

  return (
    <div className="space-y-8">
      <FilterStrip
        search={search}
        onSearch={setSearch}
        outcomeBucket={outcomeBucket}
        onOutcome={setOutcomeBucket}
        rep={rep}
        onRep={setRep}
        repOptions={repOptions}
        pattern={pattern}
        onPattern={setPattern}
        patternOptions={patternOptions}
        tier={tier}
        onTier={setTier}
        showingCount={filtered.length}
        totalCount={index.total_calls}
      />

      {heroFiltered.length > 0 ? (
        <section>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
            Featured &middot; hero demo calls
          </h2>
          <ul className="space-y-3">
            {heroFiltered.map((c) => (
              <HeroCard
                key={c.call_id}
                call={c}
                onOpen={() => setDrawerCallId(c.call_id)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {standardFiltered.length > 0 ? (
        <section>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-stewart-muted mb-3">
            All calls &middot; {standardFiltered.length} matching
          </h2>
          <ul className="rounded-lg border border-stewart-border overflow-hidden divide-y divide-stewart-border">
            {standardFiltered.map((c) => (
              <StandardRow
                key={c.call_id}
                call={c}
                onOpen={() => setDrawerCallId(c.call_id)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-stewart-border bg-stewart-card p-6 text-center text-sm text-stewart-muted">
          No calls match the current filters.
        </div>
      ) : null}

      {drawerCallId ? (
        <CallDetailDrawer
          callId={drawerCallId}
          summary={
            index.calls.find((c) => c.call_id === drawerCallId) ?? null
          }
          onClose={() => setDrawerCallId(null)}
        />
      ) : null}
    </div>
  );
}

function FilterStrip({
  search,
  onSearch,
  outcomeBucket,
  onOutcome,
  rep,
  onRep,
  repOptions,
  pattern,
  onPattern,
  patternOptions,
  tier,
  onTier,
  showingCount,
  totalCount,
}: {
  search: string;
  onSearch: (v: string) => void;
  outcomeBucket: OutcomeBucket;
  onOutcome: (v: OutcomeBucket) => void;
  rep: string;
  onRep: (v: string) => void;
  repOptions: [string, number][];
  pattern: string;
  onPattern: (v: string) => void;
  patternOptions: [string, number][];
  tier: TierFilter;
  onTier: (v: TierFilter) => void;
  showingCount: number;
  totalCount: number;
}) {
  return (
    <div className="sticky top-0 z-10 bg-stewart-bg/95 backdrop-blur-sm border-y border-stewart-border py-4 -mx-6 px-6 space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search call_id, rep, codex section, primary objection…"
          className="flex-1 bg-stewart-card border border-stewart-border rounded-md px-3 py-2 text-sm text-stewart-text placeholder:text-stewart-muted focus:border-stewart-accent focus:outline-none"
        />
        <span className="text-xs font-mono text-stewart-muted whitespace-nowrap">
          showing {showingCount} of {totalCount}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <FilterGroup label="Outcome">
          {OUTCOME_BUCKETS.map((b) => (
            <FilterChip
              key={b.key}
              active={outcomeBucket === b.key}
              onClick={() => onOutcome(b.key)}
            >
              {b.label}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Tier">
          {(
            [
              ["all", "All"],
              ["hero", "Hero (7)"],
              ["gray_matter", "Gray-matter (3)"],
              ["standard", "Standard"],
            ] as [TierFilter, string][]
          ).map(([k, label]) => (
            <FilterChip
              key={k}
              active={tier === k}
              onClick={() => onTier(k)}
            >
              {label}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterDropdown
          label="Rep"
          value={rep}
          onChange={onRep}
          options={[
            ["__all__", `All (${repOptions.length})`],
            ...repOptions.map(([name, n]) =>
              [name, `${name} (${n})`] as [string, string]
            ),
          ]}
        />

        <FilterDropdown
          label="Pattern"
          value={pattern}
          onChange={onPattern}
          options={[
            ["__all__", `All (${patternOptions.length})`],
            ...patternOptions
              .slice(0, 25)
              .map(([name, n]) =>
                [name, `${name.replace(/_/g, " ")} (${n})`] as [string, string]
              ),
          ]}
        />
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-stewart-muted uppercase tracking-wider mr-1">
        {label}:
      </span>
      {children}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "px-2.5 py-1 rounded border text-xs transition-colors " +
        (active
          ? "border-stewart-accent bg-stewart-accent/15 text-stewart-accent"
          : "border-stewart-border bg-stewart-card text-stewart-muted hover:text-stewart-text")
      }
    >
      {children}
    </button>
  );
}

function FilterDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="inline-flex items-center gap-1.5">
      <span className="text-stewart-muted uppercase tracking-wider">
        {label}:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-stewart-card border border-stewart-border rounded px-2 py-1 text-xs text-stewart-text focus:border-stewart-accent focus:outline-none"
      >
        {options.map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

function HeroCard({
  call,
  onOpen,
}: {
  call: CallSummary;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        onClick={onOpen}
        className="w-full text-left rounded-lg border border-stewart-accent/30 bg-stewart-accent/5 hover:bg-stewart-accent/10 transition-colors p-5"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-sm text-stewart-accent">
              &#9733; {call.call_id}
            </span>
            <span className="text-sm text-stewart-text">
              {call.rep_id || "—"}
            </span>
            <span
              className={
                "text-xs font-mono uppercase tracking-wider " +
                bucketTone(bucketOf(call.outcome))
              }
            >
              {(call.outcome || "unknown").replace(/_/g, " ")}
            </span>
            <span className="text-xs font-mono text-stewart-muted">
              {call.duration_min.toFixed(0)} min
            </span>
          </div>
          {call.is_gray_matter ? (
            <span className="text-[10px] uppercase tracking-wider font-mono text-amber-400 border border-amber-400/40 rounded px-1.5 py-0.5">
              ⬢ gray-matter
            </span>
          ) : null}
        </div>
        {call.tagline ? (
          <p className="text-sm text-stewart-text italic leading-relaxed">
            &ldquo;{call.tagline}&rdquo;
          </p>
        ) : null}
        {call.top_classifications.length > 0 ? (
          <p className="mt-2 text-xs text-stewart-muted">
            Pattern: {call.top_classifications.join(" · ")}
          </p>
        ) : null}
      </button>
    </li>
  );
}

function StandardRow({
  call,
  onOpen,
}: {
  call: CallSummary;
  onOpen: () => void;
}) {
  const tone = bucketTone(bucketOf(call.outcome));
  return (
    <li>
      <button
        onClick={onOpen}
        className="w-full text-left bg-stewart-card hover:bg-stewart-bg/40 transition-colors px-4 py-3 grid grid-cols-12 gap-3 items-baseline text-sm"
      >
        <span className="col-span-12 sm:col-span-3 font-mono text-stewart-text truncate">
          {call.call_id}
        </span>
        <span className="col-span-6 sm:col-span-2 text-stewart-muted truncate">
          {call.rep_id || "—"}
        </span>
        <span
          className={
            "col-span-6 sm:col-span-2 text-xs font-mono uppercase tracking-wider " +
            tone
          }
        >
          {(call.outcome || "unknown").replace(/_/g, " ")}
        </span>
        <span className="col-span-3 sm:col-span-2 text-xs font-mono text-stewart-muted">
          {call.duration_min.toFixed(0)} min
        </span>
        <span className="col-span-9 sm:col-span-3 text-xs text-stewart-muted truncate">
          {call.cherrypick_count} picks
          {call.top_classifications.length > 0 ? (
            <>
              {" · "}
              {call.top_classifications[0].replace(/_/g, " ")}
            </>
          ) : null}
        </span>
      </button>
    </li>
  );
}
