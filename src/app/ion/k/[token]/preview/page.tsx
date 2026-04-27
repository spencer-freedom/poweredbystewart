import Link from "next/link";

export const dynamic = "force-dynamic";

const SAMPLE_REPS = [
  {
    name: "Alex Rivera",
    closeRate: 0.28,
    topOpportunity: "Roof Concerns",
    weakestCluster: "Roof Concerns",
    weakestRate: 0.18,
    topPerformerRate: 0.71,
    coachingClip: "20000054949",
    framing: "warranty-backstop",
  },
  {
    name: "Marcus Bell",
    closeRate: 0.41,
    topOpportunity: "Scheduling Availability",
    weakestCluster: "Spousal / Co-Decider",
    weakestRate: 0.22,
    topPerformerRate: 0.66,
    coachingClip: "10000532255",
    framing: "two-slot-offer",
  },
  {
    name: "Priya Shah",
    closeRate: 0.52,
    topOpportunity: "Price / Affordability",
    weakestCluster: "Price / Affordability",
    weakestRate: 0.31,
    topPerformerRate: 0.74,
    coachingClip: "10000489201",
    framing: "savings-vs-bill",
  },
];

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stewart-text">
          What each of your 35 setters will see in 30 days
        </h1>
        <p className="text-stewart-muted mt-3 max-w-3xl">
          The view below is mocked — real per-rep data lights up after the
          filtered batch lands with Salesforce attribution. Every rep gets a
          personalized scorecard, their single biggest opportunity cluster, and
          a daily training brief built on their own calls.
        </p>
        <p className="text-xs text-stewart-warning mt-2 italic">
          Mock data — names and numbers are illustrative.
        </p>
      </div>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-stewart-muted mb-3">
          Per-setter scorecard
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_REPS.map((r) => (
            <div
              key={r.name}
              className="bg-stewart-card border border-stewart-border rounded-lg p-5"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-base font-semibold text-stewart-text">
                  {r.name}
                </h3>
                <span className="text-xs text-stewart-muted">setter</span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-stewart-text">
                  {Math.round(r.closeRate * 100)}%
                </span>
                <span className="text-xs text-stewart-muted">close rate</span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <Row label="Top opportunity" value={r.topOpportunity} />
                <Row
                  label="Weakest cluster"
                  value={`${r.weakestCluster} · ${Math.round(
                    r.weakestRate * 100
                  )}%`}
                  tone="danger"
                />
                <Row
                  label="Top performer"
                  value={`${Math.round(r.topPerformerRate * 100)}% on same`}
                  tone="success"
                />
              </div>
              <p className="mt-4 text-xs text-stewart-muted">
                Daily training: listen to clip from call{" "}
                <code>{r.coachingClip}</code>, practice the{" "}
                <span className="text-stewart-accent">{r.framing}</span> framing.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-stewart-muted mb-3">
          Sample daily training brief — Alex Rivera
        </h2>
        <div className="bg-stewart-card border border-stewart-border rounded-lg p-6 space-y-4">
          <div>
            <p className="text-xs text-stewart-muted">SUBJECT</p>
            <p className="text-stewart-text">
              You're 53 points behind on Roof Concerns — here's what Priya does
              differently
            </p>
          </div>
          <div>
            <p className="text-xs text-stewart-muted">YESTERDAY</p>
            <p className="text-stewart-text">
              4 calls touched roof concerns · 0 advances · all 4 ended after the
              prospect mentioned existing solar conflict
            </p>
          </div>
          <div>
            <p className="text-xs text-stewart-muted">PRIYA'S WINNING TRACK</p>
            <blockquote className="text-stewart-text italic border-l-2 border-stewart-accent pl-3">
              "Right — and that's actually one of the things our install team
              checks during the survey. If your roof needs work, we can pause
              the project and pick it back up — no cost, no commitment lost."
            </blockquote>
          </div>
          <div>
            <p className="text-xs text-stewart-muted">PRACTICE TASK</p>
            <p className="text-stewart-text">
              On your next 3 roof-concern calls, lead with the warranty-backstop
              framing within the first 90 seconds. Recordings will be auto-tagged
              for tomorrow's brief.
            </p>
          </div>
          <div>
            <p className="text-xs text-stewart-muted">YOUR PROGRESS</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-stewart-border rounded overflow-hidden">
                <div
                  className="h-full bg-stewart-accent"
                  style={{ width: "32%" }}
                />
              </div>
              <span className="text-xs text-stewart-muted font-mono">
                32% / 71% top
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-stewart-border pt-8">
        <h2 className="text-sm uppercase tracking-wider text-stewart-muted mb-2">
          The shape of the rollout
        </h2>
        <p className="text-stewart-text leading-relaxed max-w-3xl">
          Each of your 35 setters gets a personalized version of the brief
          above, every morning, drawn from their own previous-day calls
          contrasted with the top-performer playbook for the same objection
          cluster. Coaching becomes empirical — built on what actually works on
          your floor, not generic sales theory.
        </p>
        <p className="text-stewart-text leading-relaxed max-w-3xl mt-3">
          Send the next batch on the{" "}
          <Link
            href={`/ion/k/${token}/next-steps`}
            className="text-stewart-accent hover:underline"
          >
            Next Steps
          </Link>{" "}
          tab and we'll have your full taxonomy and per-rep scorecards built
          within 48 hours of the batch landing.
        </p>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger";
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-stewart-muted">{label}</span>
      <span
        className={
          "text-sm text-right " +
          (tone === "success"
            ? "text-stewart-success"
            : tone === "danger"
            ? "text-stewart-danger"
            : "text-stewart-text")
        }
      >
        {value}
      </span>
    </div>
  );
}
