import { SectionFrame } from "../_components/SectionFrame";
import { HeatMap } from "../_components/HeatMap.client";
import { AudioClip } from "../../(public)/_components/AudioClip.client";

// Build #4 — Coaching Surface (~4:30). Protected moment #2 lives here:
// the first call clip, where the room HEARS the customer. The clip card
// has built-in pause space — the UI does not rush to the next visual.
// Then the heat map shows one rep's L1/L2/L3 progression over 30 days.
//
// PLACEHOLDER CLIP: the AudioClip below points at a placeholder call_id;
// swap in a real Ion call (selected for emotional payload, not technical
// demonstration) for V2. The transcript snippet + pause beat carry the
// moment for the V1 dry run even if audio isn't wired.
const PLACEHOLDER_CALL_ID = "SAMPLE_CALL";

export function SectionCoaching() {
  return (
    <SectionFrame
      id="coaching"
      index={4}
      eyebrow="The Coaching Surface"
      title="First, listen to the call."
      question="Is the leakage real?"
      highlight={["Understand", "Classify"]}
    >
      {/* The clip — protected moment. Breathing room is intentional. */}
      <div className="rounded-xl border border-stewart-accent/30 bg-stewart-accent/5 p-6 sm:p-8 max-w-2xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent">
            A real moment from your floor
          </p>
          <span className="text-[10px] uppercase tracking-wider font-mono text-stewart-warning border border-stewart-warning/40 rounded px-1.5 py-0.5">
            sample clip
          </span>
        </div>

        <blockquote className="text-xl sm:text-2xl text-stewart-text leading-snug border-l-2 border-stewart-accent pl-4">
          &ldquo;I&apos;ve got another company coming Thursday&hellip; I just
          want to make sure I&apos;m not making a mistake.&rdquo;
        </blockquote>

        <div className="mt-5">
          <AudioClip
            callId={PLACEHOLDER_CALL_ID}
            label="Play the moment"
          />
        </div>
      </div>

      {/* Pause beat — deliberate space before the answer. */}
      <div className="my-12 text-center">
        <p className="text-lg sm:text-xl italic text-stewart-muted">
          &mdash; What did the customer actually want? &mdash;
        </p>
      </div>

      <p className="text-base text-stewart-text leading-relaxed max-w-3xl">
        Reassurance, not another quote. The keyword tools heard
        &ldquo;another company.&rdquo; Stewart heard a buyer who&apos;s
        ready &mdash; and afraid. That difference is the whole game, and
        it&apos;s coachable. Here&apos;s what coaching it looks like over a
        month:
      </p>

      <div className="mt-10">
        <HeatMap />
      </div>
    </SectionFrame>
  );
}
