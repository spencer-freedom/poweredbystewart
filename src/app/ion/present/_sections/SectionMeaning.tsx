// The intent-vs-keyword beat — moved up out of SectionHowItWorks so it sits
// right after "What does Stewart do?" and before the proof (The Miss).
// Why Stewart isn't just another call tool: keyword tools find the words;
// Stewart understands the meaning. Google vs ChatGPT, then applied to a call.

export function SectionMeaning() {
  return (
    <section className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-20 border-b border-white/10">
      <div className="max-w-4xl w-full">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          Most call tools find the words.
          <br />
          <span className="text-stewart-accent">
            Stewart understands the meaning and intent.
          </span>
        </h2>

        <div className="mt-12 grid md:grid-cols-2 gap-5">
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

        <div className="mt-8 rounded-xl border border-white/15 bg-stewart-card/60 p-5 sm:p-6">
          <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
            The same logic, applied to a call
          </p>
          <blockquote className="text-lg sm:text-xl text-stewart-text leading-snug border-l-2 border-stewart-accent pl-4">
            &ldquo;I&apos;ve got another company coming Thursday.&rdquo;
          </blockquote>
          <div className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-white/10 bg-black/40 p-4">
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
    </section>
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
          : "border-white/15 bg-black/40")
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
