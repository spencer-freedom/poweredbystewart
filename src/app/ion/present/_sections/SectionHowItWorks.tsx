import { SectionFrame } from "../_components/SectionFrame";
import { SalesMachine } from "../_components/SalesMachine";

// Build #2 — "How Stewart Works". Three ordered elements (~3:00):
//   1. Sales Machine workflow visual + rhythm-phrase overlay
//   2. Intent vs keyword side-by-side (Google vs ChatGPT) → applied to a call
//   3. Critic layer one-liner with a "checked" stamp

export function SectionHowItWorks() {
  return (
    <SectionFrame
      id="how-stewart-works"
      index={2}
      eyebrow="Goal"
      title="Stewart sits across your entire sales machine."
      question="Why hasn't existing software solved this?"
      highlight={["Observe", "Understand", "Classify", "Route", "Remember"]}
    >
      {/* 1 — Sales Machine + rhythm overlay (rhythm phrase introduced here) */}
      <SalesMachine variant="capabilities" />
      <p className="mt-4 text-base text-stewart-muted leading-relaxed max-w-3xl">
        Today the conversation stage is where it&apos;s most visible &mdash;
        but Stewart observes, understands, classifies, routes, and remembers
        across the whole thing.
      </p>

      {/* 2 — Intent vs keyword */}
      <div className="mt-16">
        <h3 className="text-xl sm:text-2xl font-bold text-stewart-text">
          Most call tools find the words. Stewart understands the meaning.
        </h3>
        <div className="mt-6 grid md:grid-cols-2 gap-5">
          <CompareCard
            kicker="Like Google search"
            tone="muted"
            heading="Finds the words you said"
            example='Query: "another company Thursday"'
            result="Returns every call where those words appear. A keyword match. No idea what it meant."
          />
          <CompareCard
            kicker="Like asking ChatGPT"
            tone="accent"
            heading="Understands what you meant"
            example='Question: "What is this customer telling us?"'
            result="An active buyer is comparing options and deciding soon. Same input, very different output."
          />
        </div>

        <div className="mt-6 rounded-xl border border-stewart-border bg-stewart-card p-5 sm:p-6">
          <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
            The same logic, applied to a call
          </p>
          <blockquote className="text-lg sm:text-xl text-stewart-text leading-snug border-l-2 border-stewart-accent pl-4">
            &ldquo;I&apos;ve got another company coming Thursday.&rdquo;
          </blockquote>
          <div className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-stewart-border bg-stewart-bg/40 p-4">
              <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
                What the keyword catches
              </p>
              <p className="text-stewart-text">
                &ldquo;another company&rdquo; · &ldquo;Thursday&rdquo;
              </p>
            </div>
            <div className="rounded-lg border border-stewart-accent/40 bg-stewart-accent/5 p-4">
              <p className="text-xs uppercase tracking-wider text-stewart-accent mb-1">
                What Stewart catches
              </p>
              <p className="text-stewart-text">
                An active buyer comparing options, deciding soon. Escalate,
                don&apos;t let it cool.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3 — Critic one-liner */}
      <div className="mt-16 flex flex-col sm:flex-row sm:items-center gap-5 rounded-xl border border-stewart-success/30 bg-stewart-success/5 p-5 sm:p-6">
        <CheckedStamp />
        <p className="text-lg sm:text-xl text-stewart-text leading-snug">
          And Stewart checks Stewart &mdash;{" "}
          <span className="text-stewart-success font-semibold">
            catches its own fabrications before they reach you.
          </span>
        </p>
      </div>
    </SectionFrame>
  );
}

function CompareCard({
  kicker,
  heading,
  example,
  result,
  tone,
}: {
  kicker: string;
  heading: string;
  example: string;
  result: string;
  tone: "muted" | "accent";
}) {
  const accent = tone === "accent";
  return (
    <div
      className={
        "rounded-xl border p-5 " +
        (accent
          ? "border-stewart-accent/40 bg-stewart-accent/5"
          : "border-stewart-border bg-stewart-bg/40")
      }
    >
      <p
        className={
          "text-xs uppercase tracking-wider font-semibold mb-2 " +
          (accent ? "text-stewart-accent" : "text-stewart-muted")
        }
      >
        {kicker}
      </p>
      <p className="text-lg font-bold text-stewart-text">{heading}</p>
      <p className="mt-3 font-mono text-sm text-stewart-muted">{example}</p>
      <p className="mt-3 text-sm text-stewart-text leading-relaxed">{result}</p>
    </div>
  );
}

function CheckedStamp() {
  return (
    <span className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-stewart-success/60 text-stewart-success rotate-[-4deg]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span className="text-xs uppercase tracking-[0.2em] font-bold">
        Checked
      </span>
    </span>
  );
}
