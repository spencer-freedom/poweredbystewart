import Link from "next/link";
import { Bridge } from "../../present/_components/Bridge";
import { SCRIPT_SECTIONS } from "../../present/_lib/corpus";

// Ion's own setting script, as the thirteen things Stewart looks for on
// every call. This is the ruler. Everything after this beat is measured
// against it.

const RECORDS = [
  "ran it, skipped it, or never got there",
  "the rep's line and the second they said it",
  "how the customer answered, and if they pushed back, why",
  "what the rep did next, and whether they got it",
];

export function SectionYourScript() {
  return (
    <section id="script" className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10 scroll-mt-20">
      <div className="max-w-4xl w-full">
        <Bridge>This is the script you already train to. Nobody has ever measured it.</Bridge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">Your script, as thirteen things Stewart looks for on every call.</h2>
        <div className="mt-10 grid md:grid-cols-[1fr_auto] gap-8 items-start">
          <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            {SCRIPT_SECTIONS.map((s, i) => (
              <li key={s.key} className="flex gap-3 text-base text-stewart-text">
                <span className="font-mono text-xs text-stewart-muted w-5 text-right shrink-0 pt-1">{i + 1}</span>
                <span>{s.label}</span>
              </li>
            ))}
          </ol>
          <div className="rounded-xl border border-stewart-border bg-stewart-card p-5 md:max-w-xs">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stewart-accent mb-3">On each one, Stewart records</p>
            <ul className="space-y-2 text-sm text-stewart-text leading-snug">
              {RECORDS.map((r) => (
                <li key={r} className="flex gap-2"><span className="text-stewart-accent shrink-0">&bull;</span><span>{r}</span></li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-stewart-muted leading-relaxed">Every quote is matched against the transcript by code before anyone sees it. If the words aren&apos;t there, the claim isn&apos;t either.</p>
          </div>
        </div>
        <p className="mt-8 text-sm text-stewart-muted">
          The full script, as Ion wrote it: <Link href="/ion/present/script" className="text-stewart-accent hover:underline">read it &rarr;</Link>
        </p>
      </div>
    </section>
  );
}
