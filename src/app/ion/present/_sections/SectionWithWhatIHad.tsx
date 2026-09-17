import { loadCorpusStats } from "../_lib/corpus";
import { Bridge } from "../_components/Bridge";

// The honest-inputs beat, right before the ask. Everything above was
// built from a folder of recordings and a script — no outcomes, no rep
// IDs, no dates, no CRM. Name that plainly, then name exactly what the
// connection unlocks. It's the data version of "I won't do this without
// being in the building."

const HAD = [
  { n: "333", label: "recordings", note: "the calls Kenny sent — his pick, not a random sample; 33 were voicemail" },
  { n: "1", label: "setting script", note: "the v2 the floor runs" },
  { n: "0", label: "outcomes", note: "no booked / sat / qualified attached to any call" },
  { n: "0", label: "rep IDs, dates, or CRM records", note: "rep names read off the tape" },
];

const UNLOCKS = [
  {
    title: "Every read tied to what happened next.",
    body: "Booked, sat, qualified, closed — joined to Stewart's read of the call. The first week of the build is this join. It's how we know if the reads are right.",
  },
  {
    title: "Every call, every day — not a folder.",
    body: "Calls land as they're made. Stewart touches every one over a minimum length; the deep read goes where it's worth it.",
  },
  {
    title: "Reps by ID, not by voice.",
    body: "Setter, team, manager — from the system, so a manager's morning is their reps and nobody else's.",
  },
  {
    title: "Your playbook, filled in with Kenny.",
    body: "The schema still has places marked TBD — what good looks like, in Ion's words. That's a room with Kenny and the managers, not a prompt.",
  },
  {
    title: "The morning list, tuned by your managers.",
    body: "The first version of “which four calls” is my guess. Week two, the managers correct it. That in-between is where Stewart stops being software and becomes Ion's.",
  },
];

export async function SectionWithWhatIHad({
  moments = 2047,
  sections = 108,
}: {
  moments?: number;
  sections?: number;
}) {
  // The counts read from the published corpus, so a re-run moves this beat too.
  const corpus = await loadCorpusStats();
  const calls = corpus?.calls ?? 300;
  const flipped = corpus?.bill.flipped ?? 5;
  const captured = corpus?.bill.captured ?? 189;
  return (
    <section
      id="inputs"
      className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10 scroll-mt-20"
    >
      <div className="max-w-5xl w-full">
        <Bridge>
          Everything you just scrolled through was built from a folder of
          recordings and a script. That&apos;s worth being clear about.
        </Bridge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          What I had. What the connection unlocks.
        </h2>

        <div className="mt-10 grid lg:grid-cols-[minmax(0,2fr)_auto_minmax(0,3fr)] gap-8 lg:gap-10 items-start">
          {/* What I had */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-muted mb-4">
              What I had
            </p>
            <ul className="space-y-4">
              {HAD.map((h) => (
                <li key={h.label} className="flex gap-4 items-baseline">
                  <span className="font-mono text-3xl font-bold text-stewart-text w-14 shrink-0 text-right">
                    {h.n}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-stewart-text">{h.label}</p>
                    <p className="text-sm text-stewart-muted">{h.note}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-stewart-muted leading-relaxed">
              From that: {calls} reads, {moments.toLocaleString()} moments, a
              playbook with {sections} sections lit, and the {flipped} of{" "}
              {captured}. That&apos;s the ceiling without a connection.
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden lg:flex items-center justify-center self-center text-stewart-accent" aria-hidden>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </div>

          {/* What the connection unlocks */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent mb-4">
              With Five9 + Salesforce + a couple days a week in the building
            </p>
            <ol className="space-y-4">
              {UNLOCKS.map((u, i) => (
                <li
                  key={u.title}
                  className="rounded-xl border border-stewart-accent/30 bg-stewart-accent/5 p-4 sm:p-5"
                >
                  <p className="text-base font-bold text-stewart-text">
                    <span className="font-mono text-sm text-stewart-accent mr-2">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {u.title}
                  </p>
                  <p className="mt-1.5 text-sm text-stewart-muted leading-relaxed">{u.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
