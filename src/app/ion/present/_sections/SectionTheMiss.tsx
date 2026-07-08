import { AudioClip } from "../../(public)/_components/AudioClip.client";

// The proof beat — "show, don't tell." Ion's script asks two anchor
// questions (the bill + "what has you interested in solar"). These are
// real Ion calls where the rep asked, the customer answered, and the rep
// glossed it into a qualifying checkbox. Grounded entirely in Ion's own
// script — zero Spencer. Lands on 0-of-332.
//
// A call can hold multiple MOMENTS (Carter shows three: the reason, the
// bill, and the call dying). Each moment has its own clip window; the full
// call is available once per card. Audio is served by /api/ion/audio-clip
// from the Supabase ion-call-audio bucket. Windows for calls with a
// word-level transcript (Meg) are exact; the rest are from line-level
// [MM:SS] timestamps — fine-tune by ear.

type Moment = {
  label?: string;
  ask: string;
  answer: string;
  miss: string;
  start: number;
  end: number;
};

type Call = {
  rep: string;
  callId: string;
  anchor: string;
  set: boolean;
  outcome: string;
  coach: string;
  moments: Moment[];
};

const CALLS: Call[] = [
  {
    rep: "Meg",
    callId: "SESSION20_2b61f758",
    anchor: "The bill",
    set: true,
    outcome: "Appointment set",
    coach: "Both anchors were on the table — the $262 got spent on a credit check.",
    moments: [
      {
        ask: "How much are you paying on average for power?",
        answer: "$262 a month.",
        miss: "Holy smokes… okay. Now the only requirement is a credit score above 670.",
        start: 138,
        end: 164,
      },
    ],
  },
  {
    rep: "Carter",
    callId: "20000555055",
    anchor: "Both anchors",
    set: false,
    outcome: "No appointment set",
    coach: "Qualified customer. Reason and bill both spent on qualifying — and the call dies when he can't get the bill.",
    moments: [
      {
        label: "The reason",
        ask: "Why are you interested in solar?",
        answer: "I was interested in getting my bills down.",
        miss: "Get your bill down? How much are you paying a month?",
        start: 15,
        end: 33,
      },
      {
        label: "The bill",
        ask: "How much are you paying a month?",
        answer: "About $120 a month.",
        miss: "Hundred and twenty… pretty expensive for you. Okay, and you're at 1508 South 2nd Avenue?",
        start: 26,
        end: 57,
      },
      {
        label: "The call dies",
        ask: "Last thing I need before we get you on the schedule is your current utility bill — mail or online?",
        answer: "I get those through the mail.",
        miss: "I'll shoot you a text — let me know once you've sent it over. …And it fizzles. No appointment.",
        start: 144,
        end: 178,
      },
    ],
  },
  {
    rep: "Joel",
    callId: "10000160568",
    anchor: "Telling, not selling",
    set: true,
    outcome: "Appointment set",
    coach: "The customer said solar was expensive. Joel sold the program instead of using it — telling, not selling.",
    moments: [
      {
        ask: "What got you interested in solar?",
        answer: "I figured it'd be expensive to do.",
        miss: "Okay, gotcha — with the incentives and programs right now, you're not paying anything out of pocket, it's just a bill swap… I've got a couple questions to make sure you qualify.",
        start: 30,
        end: 74,
      },
    ],
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
          {CALLS.map((call) => (
            <CallCard key={call.callId} call={call} />
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

function CallCard({ call }: { call: Call }) {
  return (
    <div className="rounded-xl border border-stewart-border bg-stewart-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <span className="text-sm font-semibold text-stewart-text">
          {call.rep} — a real Ion call
        </span>
        <div className="flex items-center gap-2">
          <span
            className={
              "text-[10px] uppercase tracking-wider font-mono rounded px-1.5 py-0.5 border " +
              (call.set
                ? "text-stewart-success border-stewart-success/40"
                : "text-stewart-danger border-stewart-danger/40")
            }
          >
            {call.outcome}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-mono text-stewart-accent border border-stewart-accent/40 rounded px-1.5 py-0.5">
            {call.anchor}
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {call.moments.map((m, i) => (
          <MomentBlock
            key={i}
            moment={m}
            callId={call.callId}
            divide={i > 0}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 pt-4 border-t border-stewart-border">
        <AudioClip callId={call.callId} variant="full" label="Play full call" />
        <span className="text-xs text-stewart-muted">
          — the whole call, if you want it
        </span>
      </div>

      <div className="mt-4 flex gap-3">
        <span className="text-[11px] uppercase tracking-wider text-stewart-muted shrink-0 mt-0.5">
          In a call review
        </span>
        <span className="text-sm text-stewart-text leading-relaxed">
          {call.coach}
        </span>
      </div>
    </div>
  );
}

function MomentBlock({
  moment,
  callId,
  divide,
}: {
  moment: Moment;
  callId: string;
  divide: boolean;
}) {
  return (
    <div className={divide ? "pt-5 border-t border-stewart-border/60" : ""}>
      {moment.label ? (
        <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-stewart-accent mb-2">
          {moment.label}
        </p>
      ) : null}
      <dl className="space-y-2 text-sm">
        <Line role="Rep asks" tone="muted" text={moment.ask} />
        <Line role="Customer" tone="text" text={moment.answer} />
        <Line role="Rep — the miss" tone="warning" text={moment.miss} />
      </dl>
      <div className="mt-3">
        <AudioClip
          callId={callId}
          startSec={moment.start}
          endSec={moment.end}
          label="Play the moment"
        />
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
