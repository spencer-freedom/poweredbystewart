import { AudioClip } from "../../(public)/_components/AudioClip.client";

// The proof beat — "show, don't tell." Ion's script asks two anchor
// questions (the bill + "what has you interested in solar"). These are
// real Ion calls where the rep asked, the customer answered, and the rep
// glossed it into a qualifying checkbox. Grounded entirely in Ion's own
// script — zero Spencer. Lands on 0-of-332.
//
// Clip windows capture all three parts (ask → answer → gloss). Audio is
// served by /api/ion/audio-clip from the Supabase ion-call-audio bucket;
// fine-tune start/end by ear (audio.mp3 is in each call folder).

type Clip = {
  rep: string;
  callId: string;
  start: number;
  end: number;
  anchor: string;
  ask: string;
  answer: string;
  gloss: string;
  // The coachable moment — what a team lead sees in the review. Describes
  // the gap in Ion's own terms; the coaching itself is Ion's to define.
  coach: string;
  // Real outcome of the call (from Stewart's classification).
  set: boolean;
  outcome: string;
};

const CLIPS: Clip[] = [
  {
    rep: "Meg",
    callId: "SESSION20_2b61f758",
    start: 138,
    end: 164,
    anchor: "The bill",
    ask: "How much are you paying on average for power?",
    answer: "$262 a month.",
    gloss:
      "Holy smokes… okay. Now the only requirement is a credit score above 670.",
    coach: "Both anchors were on the table — the $262 got spent on a credit check.",
    set: true,
    outcome: "Appointment set",
  },
  {
    rep: "Carter",
    callId: "20000555055",
    start: 14,
    end: 68,
    anchor: "Both anchors",
    ask: "Why are you interested in solar?",
    answer: "To get my bills down. …About $120 a month.",
    gloss:
      "Pretty expensive for you. And you're at 1508 South 2nd Avenue? … And you're the property owner?",
    coach: "Reason and bill, back to back — both spent qualifying, neither selling.",
    set: false,
    outcome: "No appointment set",
  },
  {
    rep: "Joel",
    callId: "10000160568",
    start: 30,
    end: 74,
    anchor: "Why solar + the bill",
    ask: "What got you interested in solar?",
    answer: "I figured it'd be expensive to do.",
    gloss:
      "Okay, gotcha. With the programs it's just a bill swap — I do have a couple questions to make sure you qualify.",
    coach: "He named his own objection. It got a “gotcha” and a credit question.",
    set: true,
    outcome: "Appointment set",
  },
];

export function SectionTheMiss() {
  return (
    <section className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10">
      <div className="max-w-3xl w-full">
        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent mb-4">
          Your own calls
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          Your script asks two things: the bill, and why they want solar.
        </h2>
        <p className="mt-5 text-lg text-stewart-muted leading-relaxed">
          It asks them for a reason — they&apos;re the anchors the whole call
          is built on. Listen to what happens to both.
        </p>

        <div className="mt-12 space-y-6">
          {CLIPS.map((clip) => (
            <ClipCard key={clip.callId} clip={clip} />
          ))}
        </div>

        <p className="mt-8 text-base text-stewart-muted leading-relaxed">
          This is exactly what your team leads see in a Stewart call review.
          The question is{" "}
          <span className="text-stewart-text font-medium">
            how Ion wants to train on it.
          </span>
        </p>

        <div className="mt-14 text-center">
          <p className="text-5xl sm:text-6xl font-bold text-stewart-warning">
            0 of 332
          </p>
          <p className="mt-4 text-lg text-stewart-text leading-relaxed max-w-xl mx-auto">
            Not one call used the bill to build value. It&apos;s the single
            largest upside on your floor — and it&apos;s a question your script
            already asks.
          </p>
        </div>
      </div>
    </section>
  );
}

function ClipCard({ clip }: { clip: Clip }) {
  return (
    <div className="rounded-xl border border-stewart-border bg-stewart-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <span className="text-sm font-semibold text-stewart-text">
          {clip.rep} — a real Ion call
        </span>
        <div className="flex items-center gap-2">
          <span
            className={
              "text-[10px] uppercase tracking-wider font-mono rounded px-1.5 py-0.5 border " +
              (clip.set
                ? "text-stewart-success border-stewart-success/40"
                : "text-stewart-danger border-stewart-danger/40")
            }
          >
            {clip.outcome}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-mono text-stewart-accent border border-stewart-accent/40 rounded px-1.5 py-0.5">
            {clip.anchor}
          </span>
        </div>
      </div>

      <dl className="space-y-3 text-sm">
        <Line role="Rep asks" tone="muted" text={clip.ask} />
        <Line role="Customer" tone="text" text={clip.answer} />
        <Line role="Rep — the miss" tone="warning" text={clip.gloss} />
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <AudioClip
          callId={clip.callId}
          startSec={clip.start}
          endSec={clip.end}
          label="Play the moment"
        />
        <AudioClip callId={clip.callId} variant="full" label="Play full call" />
      </div>

      {/* The coachable moment — what a team lead sees in a Stewart review */}
      <div className="mt-4 pt-4 border-t border-stewart-border flex gap-3">
        <span className="text-[11px] uppercase tracking-wider text-stewart-muted shrink-0 mt-0.5">
          In a call review
        </span>
        <span className="text-sm text-stewart-text leading-relaxed">
          {clip.coach}
        </span>
      </div>
    </div>
  );
}

function Line({
  role,
  text,
  tone,
}: {
  role: string;
  text: string;
  tone: "muted" | "text" | "warning";
}) {
  const color =
    tone === "warning"
      ? "text-stewart-warning"
      : tone === "text"
      ? "text-stewart-text"
      : "text-stewart-muted";
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 items-baseline">
      <dt className="text-[11px] uppercase tracking-wider text-stewart-muted">
        {role}
      </dt>
      <dd className={color}>&ldquo;{text}&rdquo;</dd>
    </div>
  );
}
