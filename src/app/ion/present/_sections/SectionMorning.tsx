import { Bridge } from "../_components/Bridge";

// The product, as a manager meets it: the Daily Morning View inside a
// phone frame, embedded live from /ion/manager (same URL works on a real
// phone). Four real calls, one line each on why, a 15–35 second clip
// instead of a 5–21 minute call, mark it coached.

export function SectionMorning() {
  return (
    <section
      id="morning"
      className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10 scroll-mt-20"
    >
      <div className="max-w-5xl w-full">
        <Bridge>
          Your managers don&apos;t read 300 of those. They open this.
        </Bridge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          What a manager opens in the morning.
        </h2>

        <div className="mt-10 flex flex-col lg:flex-row items-center lg:items-start gap-10 lg:gap-14">
          {/* Phone frame around the live /ion/manager page */}
          <div className="shrink-0">
            <div className="rounded-[2.5rem] border-[10px] border-stewart-border bg-black p-2 shadow-2xl w-[300px]">
              <iframe
                src="/ion/manager/brief"
                title="Daily Morning View — manager surface"
                className="w-full h-[620px] rounded-[1.8rem] bg-stewart-bg"
              />
            </div>
          </div>

          <div className="max-w-md space-y-5 text-lg text-stewart-muted leading-relaxed">
            <p>
              Not a dashboard to study. A short list to act on. Four calls
              &mdash; the four from this walkthrough &mdash; each with one line
              on why it&apos;s worth opening.
            </p>
            <p>
              <span className="text-stewart-text font-medium">
                Tap the moment, not the call.
              </span>{" "}
              Twenty seconds of Meg at 01:29 instead of twenty-one minutes of
              Meg. Then mark it coached.
            </p>
            <p>
              It looks boring on purpose. It&apos;s an extension of the CRM
              your managers already live in &mdash; the depth is underneath
              when they want it.
            </p>
            <p className="text-sm">
              This is the live{" "}
              <span className="font-mono text-stewart-text">/ion/manager/brief</span>{" "}
              page &mdash; open it on your phone. The full surface, every call
              ranked with the weights on screen, is at{" "}
              <a href="/ion/manager" className="font-mono text-stewart-accent hover:underline">
                /ion/manager
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
