// Compact vertical flow diagram of Stewart's pipeline.
//
//   Call audio + transcript
//        ↓
//   Stage 3 — Trajectory Synthesis (Claude Sonnet 4.6)
//        ↓
//   Stage 4 — Critic Audit (Claude Sonnet 4.6, diff prompt)
//        ↓
//   Outputs — manager brief / cherry-picks / handoff brief
//
// Used as a sidebar in §2 to reinforce that this isn't a black box.
// Pure CSS + inline SVG, no deps.

import {
  Phone,
  FileText,
  Brain,
  ShieldCheck,
  LayoutList,
} from "lucide-react";

export function PipelineFlow() {
  return (
    <aside className="rounded-lg border border-stewart-border bg-stewart-card p-5 space-y-3 max-w-xs">
      <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent">
        How Stewart processes a call
      </p>
      <Step
        icon={<Phone size={14} />}
        title="Call audio"
        body="Deepgram transcribes — timestamped, speaker-diarized."
      />
      <Arrow />
      <Step
        icon={<FileText size={14} />}
        title="Transcript"
        body="Speaker turns, timestamps, lowercased."
      />
      <Arrow />
      <Step
        icon={<Brain size={14} />}
        title="Stage 3 · Trajectory Synthesis"
        meta="Claude Sonnet 4.6"
        body="Reads transcript + schema. Cites every claim with ts + literal quote + reason."
        emphasis
      />
      <Arrow />
      <Step
        icon={<ShieldCheck size={14} />}
        title="Stage 4 · Critic Audit"
        meta="Same family, diff prompt"
        body="Verifies every quote. Flags fabrications. Verdict: revise or ship."
        emphasis
      />
      <Arrow />
      <Step
        icon={<LayoutList size={14} />}
        title="Stewart's outputs"
        body="Manager brief · cherry-picks · handoff brief (if booked)."
      />
    </aside>
  );
}

function Step({
  icon,
  title,
  meta,
  body,
  emphasis,
}: {
  icon: React.ReactNode;
  title: string;
  meta?: string;
  body: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        "rounded-md border p-3 " +
        (emphasis
          ? "border-stewart-accent/40 bg-stewart-accent/5"
          : "border-stewart-border bg-stewart-bg/40")
      }
    >
      <div className="flex items-baseline gap-2 mb-1">
        <span
          className={
            "shrink-0 inline-flex w-5 h-5 items-center justify-center rounded " +
            (emphasis
              ? "bg-stewart-accent/20 text-stewart-accent"
              : "bg-stewart-card text-stewart-muted")
          }
        >
          {icon}
        </span>
        <span className="text-sm font-semibold text-stewart-text leading-tight">
          {title}
        </span>
      </div>
      {meta ? (
        <p className="text-[10px] uppercase tracking-wider text-stewart-muted font-mono ml-7 mb-1">
          {meta}
        </p>
      ) : null}
      <p className="text-xs text-stewart-muted leading-relaxed ml-7">
        {body}
      </p>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex justify-center" aria-hidden>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-stewart-muted"
      >
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
    </div>
  );
}
