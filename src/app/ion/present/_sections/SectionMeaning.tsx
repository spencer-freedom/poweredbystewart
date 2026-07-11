// The intent-vs-keyword beat — sits right after "What does Stewart do?" and
// before the proof (The Miss). Why Stewart isn't just another call tool:
// keyword tools search words; Stewart understands meaning + intent. One real
// customer line does the heavy lifting — read two ways, side by side.

export function SectionMeaning() {
  return (
    <section className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-20 border-b border-white/10">
      <div className="max-w-4xl w-full">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          Most call tools search keywords and key phrases.
          <br />
          <span className="text-stewart-accent">
            Stewart understands the meaning and intent.
          </span>
        </h2>

        {/* The one line — front and center. */}
        <div className="mt-12">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-muted mb-3">
            On the call, the customer says
          </p>
          <blockquote className="text-2xl sm:text-3xl font-semibold text-stewart-text leading-snug border-l-2 border-stewart-accent pl-5">
            &ldquo;My bill hit almost $300 last month.&rdquo;
          </blockquote>
        </div>

        {/* Two readings of that same line. */}
        <div className="mt-8 grid md:grid-cols-2 gap-5">
          <ReadCard
            kicker="Like Google search"
            tone="muted"
            heading="Keyword & key-phrase search"
            body="Catches “$300” and logs it as the bill amount — a data field. The way most AI call-review software works: it hears the words, not what they meant."
          />
          <ReadCard
            kicker="Like asking ChatGPT"
            tone="accent"
            heading="Understands meaning & intent"
            body="The customer just handed you their reason to buy. That's pain about the bill — the exact why to sell into. Speak to it."
          />
        </div>
      </div>
    </section>
  );
}

function ReadCard({
  kicker,
  heading,
  body,
  tone,
}: {
  kicker: string;
  heading: string;
  body: string;
  tone: "muted" | "accent";
}) {
  const accent = tone === "accent";
  return (
    <div
      className={
        "rounded-xl border p-5 sm:p-6 " +
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
      <p className="text-lg sm:text-xl font-bold text-stewart-text">{heading}</p>
      <p
        className={
          "mt-3 text-base leading-relaxed " +
          (accent ? "text-stewart-text" : "text-stewart-muted")
        }
      >
        {body}
      </p>
    </div>
  );
}
