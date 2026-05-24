import { ScrollSection } from "./ScrollSection";
import { SchemaExcerpt } from "../_visuals";

const CONTRAST_ROWS = [
  {
    generic: "Same closed-taxonomy classification across all customers",
    stewart:
      "Your schema IS the classification — Ion's intros, your protocols, Kenny's coaching philosophy, the Tesla relationship truth",
  },
  {
    generic:
      "Findings like “reps say ‘um’ too much” — anyone with ears could spot those",
    stewart:
      "Findings like “the bill-as-villain inversion was executed zero times across 332 of your calls” — Stewart finds what nobody has time to count",
  },
  {
    generic:
      "~12-week utilization curve drops below 30%. Managers stop trusting the briefings.",
    stewart:
      "Stewart's reads improve every week as the schema matures + Kenny validates exemplars",
  },
];

export function Section1CustomBuilt() {
  return (
    <ScrollSection id="custom-built">
      <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
        The pitch
      </p>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight max-w-4xl">
        Stewart isn&apos;t a generic AI sales tool. It&apos;s a custom system
        built FOR your floor &mdash; using your calls, your scripts, your
        coaching philosophy.
      </h1>

      <div className="mt-8 grid lg:grid-cols-2 gap-10 items-start">
        <div className="space-y-6 text-stewart-muted text-lg leading-relaxed">
          <p>
            Generic call-analysis platforms ship with one definition of
            &ldquo;good&rdquo; that&apos;s supposed to fit every floor in
            every industry. Ion isn&apos;t a generic floor. Your reps
            don&apos;t sound like Gong&apos;s training data. Your customers
            don&apos;t object like the benchmark dataset. Stewart is built
            to fit the floor it&apos;s deployed on &mdash; not the other
            way around.
          </p>
        </div>

        <SchemaExcerpt />
      </div>

      <div className="mt-12 rounded-lg border border-stewart-border overflow-hidden">
        <div className="hidden md:grid md:grid-cols-2 bg-stewart-card/60 border-b border-stewart-border">
          <div className="px-5 py-3 text-xs uppercase tracking-wider font-semibold text-stewart-muted border-r border-stewart-border">
            Generic AI sales tools
          </div>
          <div className="px-5 py-3 text-xs uppercase tracking-wider font-semibold text-stewart-accent">
            Stewart for Ion
          </div>
        </div>
        <div className="divide-y divide-stewart-border">
          {CONTRAST_ROWS.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-2 bg-stewart-card"
            >
              <div className="px-5 py-4 text-sm text-stewart-muted md:border-r md:border-stewart-border">
                <p className="text-xs uppercase tracking-wider text-stewart-muted/70 md:hidden mb-1">
                  Generic
                </p>
                {row.generic}
              </div>
              <div className="px-5 py-4 text-sm text-stewart-text">
                <p className="text-xs uppercase tracking-wider text-stewart-accent md:hidden mb-1">
                  Stewart for Ion
                </p>
                {row.stewart}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat number="1,153" label="lines of Ion-specific schema" />
        <Stat
          number="101"
          label="schema sections actively lit across your corpus"
        />
        <Stat number="332" label="of your calls processed" />
      </div>

      <p className="mt-12 text-xl sm:text-2xl text-stewart-text font-medium leading-snug max-w-3xl">
        Stewart is built <em className="not-italic text-stewart-accent">with</em>{" "}
        you. Not bought from a shelf.
      </p>
    </ScrollSection>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-lg border border-stewart-border bg-stewart-card p-4">
      <div className="text-2xl font-bold text-stewart-accent">{number}</div>
      <div className="text-xs text-stewart-muted mt-1">{label}</div>
    </div>
  );
}
