// The upside flip — right after 0-of-332. The same two anchors, now USED:
// the customer's own reason for wanting solar + their bill, to reinforce
// the want and set the appointment. Downstream effects run the schema's own
// KPI chain: set rate → sit rate → close-from-sit.

import { HearBoth } from "../../(public)/_components/HearBoth.client";

// "Hear the difference" — the same three real calls from The Miss, now with
// the coached line rendered in each rep's OWN cloned voice (ElevenLabs, via
// /api/ion/alt-take). actualQuote/start/end/callId mirror SectionTheMiss so
// the room hears the real miss, then hears what the rep could've said.
//
// GROUNDING RUBRIC for altText (LOCKED — see stewart-ion-pitch.md +
// memory project_pitch_grounds_in_ion_script). Every "could've said" must be
// Ion's OWN v2 script step, simply USED — never Spencer's coaching:
//   • Reflect the customer's stated REASON (WHY anchor: "What interested you in
//     solar? — Expand to validate") in THEIR own words, and/or their BILL
//     (BILL anchor: "how much are you paying a month?"), then move to qualify /
//     set the appointment. That's the script's own step the rep skipped.
//   • DO NOT dramatize the bill as loss ("money going out the door", "$X a year
//     just gone", "on the table") — that's Spencer's bill-as-villain flip,
//     EXCLUDED pre-contract / post-contract only.
//   • Don't invent motive ("that's why people look at this") — use the
//     customer's own reason if they gave one.
// The altText below is PLACEHOLDER mock — refine in /ion/present/voice-studio
// against this rubric before any live pitch.
const AB_CALLS = [
  {
    rep: "Meg",
    setup: "$262 on the table.",
    callId: "SESSION20_2b61f758",
    startSec: 138,
    endSec: 164,
    actualQuote:
      "Holy smokes… okay. Now the only requirement is a credit score above 670.",
    altText:
      "Two-sixty-two a month — that's real money going out the door every single month. And that's exactly what we're here to fix: the whole goal is getting that bill down for you. So let's make sure you're set up to qualify — I've just got a couple quick questions.",
  },
  {
    rep: "Joel",
    setup: "“I figured it'd be expensive.”",
    callId: "10000160568",
    startSec: 30,
    endSec: 74,
    actualQuote:
      "Okay, gotcha — with the incentives and programs right now, you're not paying anything out of pocket, it's just a bill swap… I've got a couple questions to make sure you qualify.",
    altText:
      "Yeah, honestly a lot of folks assume that. But the way it works, it's really just swapping your power bill for a lower one — so the whole goal is getting that bill down for you. Mind if I ask what you're paying a month right now?",
  },
  {
    rep: "Carter",
    setup: "$120 a month, still browsing.",
    callId: "20000555055",
    startSec: 26,
    endSec: 57,
    actualQuote:
      "Hundred and twenty… pretty expensive for you. Okay, and you're at 1508 South 2nd Avenue?",
    altText:
      "A hundred and twenty a month — that's around fifteen hundred dollars a year just gone. That's the whole reason people look at this: getting that bill down. Let me grab your details real quick so we can show you exactly what you'd be saving.",
  },
];

const EFFECTS = [
  {
    kpi: "Set rate",
    title: "More appointments set.",
    body: "The appointment gets set on the customer's own reason — not a pitch they can brush off.",
  },
  {
    kpi: "Sit rate",
    title: "Stickier sits.",
    body: "They prioritize showing up, because it's their reason on the line. Fewer no-shows.",
  },
  {
    kpi: "Close-from-sit",
    title: "Easier closes.",
    body: "The specialist walks in already knowing what to hit — the setter handed them the sale.",
  },
];

export function SectionImagine() {
  return (
    <section className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10">
      <div className="max-w-3xl w-full">
        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent mb-4">
          Now imagine the opposite
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          Imagine every call used what the customer already gave you.
        </h2>
        <p className="mt-5 text-lg text-stewart-muted leading-relaxed">
          Their reason for wanting solar, and their bill — used to reinforce
          the want, and to set the appointment.
        </p>

        {/* Hear the difference — real miss vs. the coached line in the rep's
            own (cloned) voice. Same three calls from the section above. */}
        <div className="mt-12 space-y-6">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent">
            Hear the difference — in their own voice
          </p>
          {AB_CALLS.map((c) => (
            <div key={c.callId + c.startSec}>
              <p className="text-sm text-stewart-muted mb-2">
                <span className="font-semibold text-stewart-text">{c.rep}</span>
                {" — "}
                {c.setup}
              </p>
              <HearBoth
                rep={c.rep}
                callId={c.callId}
                startSec={c.startSec}
                endSec={c.endSec}
                actualQuote={c.actualQuote}
                altText={c.altText}
              />
            </div>
          ))}
          <p className="text-xs italic text-stewart-muted/70">
            The &ldquo;could&apos;ve said&rdquo; lines are generated in each
            rep&apos;s cloned voice — a coaching illustration, not real call audio.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-3 gap-5">
          {EFFECTS.map((e) => (
            <div
              key={e.kpi}
              className="rounded-xl border border-stewart-border bg-stewart-card p-5"
            >
              <p className="text-[11px] uppercase tracking-wider font-semibold text-stewart-accent mb-2">
                {e.kpi}
              </p>
              <p className="text-lg font-bold text-stewart-text leading-snug">
                {e.title}
              </p>
              <p className="mt-2 text-sm text-stewart-muted leading-relaxed">
                {e.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-lg text-stewart-text">
          Set rate. Sit rate. Close. <span className="text-stewart-muted">One move the customer already handed the rep — all three.</span>
        </p>
      </div>
    </section>
  );
}
