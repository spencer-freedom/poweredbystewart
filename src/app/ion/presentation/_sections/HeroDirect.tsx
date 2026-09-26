import Link from "next/link";
import { loadCorpusStats } from "../../present/_lib/corpus";

// The direct opening. No metaphor: what Stewart does, in one sentence,
// and the number that proves it was done.

export async function HeroDirect() {
  const s = await loadCorpusStats();
  const calls = s?.calls ?? 298;
  return (
    <section id="hero" className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10 scroll-mt-20">
      <div className="max-w-4xl w-full">
        <p className="text-xs uppercase tracking-[0.25em] text-stewart-accent font-semibold">Powered by Stewart &times; Ion Solar</p>
        <h1 className="mt-6 text-4xl sm:text-5xl lg:text-7xl font-bold text-stewart-text leading-[1.05]">
          Stewart reads every call against your script.
        </h1>
        <p className="mt-6 max-w-2xl text-xl sm:text-2xl text-stewart-muted leading-snug">
          Every section &mdash; ran it, skipped it, never got there &mdash; with the line the rep said and the second they said it.
          Then the bill, the objections and what worked, the outcome. Floor-wide and per rep.
        </p>
        <p className="mt-10 font-mono text-sm text-stewart-muted">
          {calls.toLocaleString()} of your calls, read this way. Every number in here clicks through to the tape.
        </p>
        <div className="mt-12 flex flex-wrap items-center gap-4 text-sm">
          <a href="#script" className="px-4 py-2 rounded-md bg-stewart-accent/15 text-stewart-accent font-medium hover:bg-stewart-accent/25 transition-colors">Start with your script &darr;</a>
          <Link href="/ion/manager" className="text-stewart-muted hover:text-stewart-text">or open the manager surface &rarr;</Link>
        </div>
      </div>
    </section>
  );
}
