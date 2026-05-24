import Link from "next/link";
import { ScrollSection } from "./ScrollSection";

export function Section4Brain() {
  return (
    <ScrollSection id="brain">
      <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
        Under the hood
      </p>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stewart-text leading-tight max-w-4xl">
        Every call your floor makes flows into Stewart&apos;s brain.
      </h2>

      <div className="mt-6 space-y-5 text-lg text-stewart-muted leading-relaxed max-w-3xl">
        <p>
          Stewart&apos;s brain has three layers: the{" "}
          <strong className="text-stewart-text">core</strong> is your
          codex &mdash; your scripts, protocols, coaching philosophy.
          It&apos;s hard. It only changes when you change it. The{" "}
          <strong className="text-stewart-text">gray matter</strong> is
          the calls Kenny validates as exemplary &mdash; &ldquo;this is
          what good looks like for that codex section.&rdquo; Sticky.
          Always lit. The{" "}
          <strong className="text-stewart-text">soft brain</strong> is
          the calls cycling through &mdash; every Stewart-processed call
          leaves a satellite in orbit around the codex sections it
          activated. Recent calls flow; old calls age out (text artifacts
          retained forever; audio archived to Five9 after Stewart&apos;s
          hot-tier window).
        </p>
        <p>
          The brain is the institutional memory of your sales floor.
          Patterns that used to live only in Kenny&apos;s head &mdash;
          now queryable by any manager.
        </p>
      </div>

      <div className="mt-10 grid lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 rounded-lg border border-stewart-border bg-stewart-card overflow-hidden">
          {/*
            Remotion paths locked per scaffolding-decisions § Brain mirror:
              public/ion/brain-walkthrough.mp4
              public/ion/brain-walkthrough-poster.jpg
          */}
          <video
            controls
            preload="none"
            poster="/ion/brain-walkthrough-poster.jpg"
            className="w-full aspect-video bg-black"
          >
            <source src="/ion/brain-walkthrough.mp4" type="video/mp4" />
            <track kind="captions" />
          </video>
          <div className="px-4 py-3 border-t border-stewart-border text-xs text-stewart-muted">
            Brain walkthrough video &mdash; Remotion render in progress.
          </div>
        </div>

        <Link
          href="/ion/brain"
          className="lg:col-span-2 group block rounded-lg border border-stewart-accent/40 bg-stewart-accent/5 p-6 hover:bg-stewart-accent/10 transition-colors"
        >
          <p className="text-base sm:text-lg font-semibold text-stewart-text leading-snug">
            See Stewart&apos;s brain on your 332 calls{" "}
            <span className="text-stewart-accent group-hover:translate-x-1 inline-block transition-transform">
              &rarr;
            </span>
          </p>
          <p className="text-sm text-stewart-muted mt-3 leading-relaxed">
            101 codex sections lit. 1,432 cherry-pick moments mapped.
            Click to explore.
          </p>
        </Link>
      </div>

      <p className="mt-10 text-sm text-stewart-muted leading-relaxed max-w-3xl">
        Stewart has already processed{" "}
        <span className="text-stewart-text font-semibold">332</span> of
        your calls &mdash; production processing happens on whatever
        cadence you set in Phase 2+.
      </p>
    </ScrollSection>
  );
}
