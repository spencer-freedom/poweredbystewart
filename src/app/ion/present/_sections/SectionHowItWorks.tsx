import { SectionFrame } from "../_components/SectionFrame";
import { SalesMachine } from "../_components/SalesMachine";

// Build #2 — "How Stewart Works". Three ordered elements (~3:00):
//   1. Sales Machine workflow visual + rhythm-phrase overlay
//   2. Intent vs keyword side-by-side (Google vs ChatGPT) → applied to a call
//   3. Critic layer one-liner with a "checked" stamp

export function SectionHowItWorks() {
  return (
    <SectionFrame
      id="how-stewart-works"
      index={2}
      eyebrow="Goal"
      title="Stewart sits across your entire sales machine."
      question="Why hasn't existing software solved this?"
      highlight={["Observe", "Understand", "Classify", "Route", "Remember"]}
    >
      {/* 1 — Sales Machine + rhythm overlay (rhythm phrase introduced here) */}
      <SalesMachine variant="capabilities" />
      <p className="mt-4 text-base text-stewart-muted leading-relaxed max-w-3xl">
        Today the conversation stage is where it&apos;s most visible &mdash;
        but Stewart observes, understands, classifies, routes, and remembers
        across the whole thing.
      </p>

      {/* 2 — Intent vs keyword moved up to SectionMeaning (now sits between
          "What does Stewart do?" and The Miss). */}

      {/* 3 — Critic one-liner */}
      <div className="mt-16 flex flex-col sm:flex-row sm:items-center gap-5 rounded-xl border border-stewart-success/30 bg-stewart-success/5 p-5 sm:p-6">
        <CheckedStamp />
        <p className="text-lg sm:text-xl text-stewart-text leading-snug">
          And Stewart checks Stewart &mdash;{" "}
          <span className="text-stewart-success font-semibold">
            catches its own fabrications before they reach you.
          </span>
        </p>
      </div>
    </SectionFrame>
  );
}

function CheckedStamp() {
  return (
    <span className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-stewart-success/60 text-stewart-success rotate-[-4deg]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span className="text-xs uppercase tracking-[0.2em] font-bold">
        Checked
      </span>
    </span>
  );
}
