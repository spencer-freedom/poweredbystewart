import Link from "next/link";
import { fetchDecisionTree, type DecisionTreePayload } from "@/lib/ion-api";
import { ErrorPanel } from "./_components/error-panel";

export const dynamic = "force-dynamic";

export default async function IonLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let data: DecisionTreePayload;
  try {
    data = await fetchDecisionTree(token);
  } catch (e) {
    return <ErrorPanel error={e instanceof Error ? e.message : String(e)} />;
  }

  const stats = data.pipeline_stats;
  const clusters = [...(data.clusters || [])].sort(
    (a, b) => b.frequency - a.frequency
  );
  // Killer-insight headline: surface the strongest signal — highest win-rate
  // cluster with enough calls to be defensible. Falls back to most-frequent
  // cluster if nothing meets the threshold.
  const MIN_CALLS_FOR_HEADLINE = 5;
  const candidates = clusters.filter(
    (c) => c.frequency >= MIN_CALLS_FOR_HEADLINE
  );
  const lead =
    candidates.length > 0
      ? [...candidates].sort((a, b) => b.win_rate - a.win_rate)[0]
      : clusters[0];
  const totalTracks = data.word_tracks?.length || 0;
  const totalLosing = data.losing_patterns?.length || 0;
  const FLOOR_SIZE = 35; // Kenny's setter floor

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section>
        <p className="text-xs uppercase tracking-wider text-stewart-muted mb-3">
          Hi Kenny — built on your floor&apos;s calls
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-stewart-text">
          {lead ? (
            <>
              The biggest pattern in your floor:{" "}
              <span className="text-stewart-accent">{lead.name}</span> —{" "}
              {Math.round(lead.win_rate * 100)}% win rate across{" "}
              {lead.frequency} calls.
            </>
          ) : (
            "Decision tree built on your inside-sales calls."
          )}
        </h1>
        <p className="mt-5 text-stewart-muted max-w-3xl text-lg">
          {totalTracks} winning word tracks across {clusters.length} objection
          categories. Every line is a verbatim quote from one of your reps.
        </p>
      </section>

      {/* Stats strip */}
      <section className="grid sm:grid-cols-5 gap-3">
        <Stat label="sales conversations" value={stats.n_real_sales} />
        <Stat label="advances" value={stats.n_wins} accent />
        <Stat label="objection clusters" value={clusters.length} />
        <Stat label="winning word tracks" value={totalTracks} />
        <Stat label="losing patterns" value={totalLosing} />
      </section>

      {/* What this is */}
      <Section
        eyebrow="What this is"
        title="An empirical sales playbook — built on your floor, not theory"
      >
        <ul className="space-y-3">
          <Bullet>
            <strong className="text-stewart-text">Every winning track is a verbatim quote</strong>
            , attributed to the rep who said it and the call it came from.
            Click any track in the Decision Tree to hear the actual audio.
          </Bullet>
          <Bullet>
            <strong className="text-stewart-text">Every objection cluster came from how your prospects actually push back</strong>
            , not from a generic objection-handling script. {clusters.length}{" "}
            categories drawn from {stats.n_real_sales} real sales conversations.
          </Bullet>
          <Bullet>
            <strong className="text-stewart-text">Win rates are observed outcomes</strong>
            , not opinion — {stats.n_wins} appointments booked,{" "}
            {stats.n_engaged_noset} engaged-no-set, {stats.n_hard_losses} hard
            losses. The math is your floor&apos;s, not ours.
          </Bullet>
        </ul>
      </Section>

      {/* What it does */}
      <Section
        eyebrow="What it does for your floor"
        title="Replace coaching opinions with what actually works on your calls"
      >
        <ul className="space-y-3">
          <Bullet>
            See <strong className="text-stewart-text">exactly what your top performers say</strong> when{" "}
            {lead?.name || "the biggest objection"} comes up — and what your
            strugglers don&apos;t.
          </Bullet>
          <Bullet>
            Train new setters on{" "}
            <strong className="text-stewart-text">the objections that actually move appointments</strong>
            , sorted by frequency. No more time wasted on rare edge cases.
          </Bullet>
          <Bullet>
            Catch <strong className="text-stewart-text">losing patterns</strong>{" "}
            — what your reps say right before a prospect declines.{" "}
            {totalLosing} examples already flagged across the {clusters.length}{" "}
            clusters.
          </Bullet>
          <Bullet>
            Scale to all{" "}
            <strong className="text-stewart-text">{FLOOR_SIZE} setters</strong>{" "}
            with a per-rep daily training brief built on their own previous-day
            calls — once Stage B lands.
          </Bullet>
        </ul>
        <div className="mt-6">
          <Link
            href={`/ion/k/${token}/tree`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-stewart-accent text-white text-sm font-medium hover:bg-stewart-accent/90 transition-colors"
          >
            Open the Decision Tree →
          </Link>
        </div>
      </Section>

      {/* Why we need more calls */}
      <Section
        eyebrow="What unlocks Stage B"
        title="Why we need a bigger sample to productionize this"
        tone="warning"
      >
        <p className="text-stewart-muted leading-relaxed">
          {stats.n_real_sales} calls is enough to find patterns. It&apos;s not
          enough to call them statistically validated, and it&apos;s definitely
          not enough to coach individual reps from. Stage B fixes that.
        </p>
        <ul className="space-y-3 mt-4">
          <Bullet tone="warning">
            <strong className="text-stewart-text">Most winning tracks are n=1</strong>{" "}
            — one example each. The pattern is real, but more reps repeating it
            is what tells us it scales beyond the rep who originated it.
          </Bullet>
          <Bullet tone="warning">
            <strong className="text-stewart-text">No per-rep view yet</strong>{" "}
            — without Salesforce <code>Activity.OwnerId</code> attribution, every
            track is anonymous. We can&apos;t tell Alex apart from Marcus.
          </Bullet>
          <Bullet tone="warning">
            <strong className="text-stewart-text">Stage B = 200+ wins + 200+ engaged losses + setter attribution</strong>
            . That&apos;s the dataset that turns this from a directional read
            into a per-rep daily training engine across your full floor.
          </Bullet>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/ion/k/${token}/next-steps`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-stewart-warning/15 text-stewart-warning border border-stewart-warning/40 text-sm font-medium hover:bg-stewart-warning/25 transition-colors"
          >
            See exactly what we need →
          </Link>
          <Link
            href={`/ion/k/${token}/preview`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-stewart-muted hover:text-stewart-text text-sm transition-colors"
          >
            Preview what each setter will see →
          </Link>
        </div>
      </Section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-4 " +
        (accent
          ? "border-stewart-accent/40 bg-stewart-accent/5"
          : "border-stewart-border bg-stewart-card")
      }
    >
      <div
        className={
          "text-2xl font-bold " +
          (accent ? "text-stewart-accent" : "text-stewart-text")
        }
      >
        {value}
      </div>
      <div className="text-xs text-stewart-muted mt-1">{label}</div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  tone,
  children,
}: {
  eyebrow: string;
  title: string;
  tone?: "warning";
  children: React.ReactNode;
}) {
  const accentClass =
    tone === "warning"
      ? "border-stewart-warning/40 bg-stewart-warning/5"
      : "border-stewart-border bg-stewart-card";
  const eyebrowClass =
    tone === "warning" ? "text-stewart-warning" : "text-stewart-accent";
  return (
    <section className={`rounded-lg border p-6 sm:p-8 ${accentClass}`}>
      <p
        className={`text-xs uppercase tracking-wider font-semibold mb-2 ${eyebrowClass}`}
      >
        {eyebrow}
      </p>
      <h2 className="text-xl sm:text-2xl font-bold text-stewart-text leading-tight mb-5">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bullet({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "warning";
}) {
  const dotClass =
    tone === "warning" ? "text-stewart-warning" : "text-stewart-accent";
  return (
    <li className="flex gap-3 text-stewart-muted leading-relaxed">
      <span className={`shrink-0 mt-1.5 ${dotClass}`}>▸</span>
      <span>{children}</span>
    </li>
  );
}
