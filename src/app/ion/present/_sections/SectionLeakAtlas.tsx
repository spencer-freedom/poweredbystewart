import { SectionFrame } from "../_components/SectionFrame";
import { SalesMachine } from "../_components/SalesMachine";

// Build #5 — The Leak Atlas (~4:00). Protected moment #3: the room
// realizes this isn't isolated coaching, it's a management problem they
// can finally see. Four leaks, one per category, then the Sales Machine
// returns with the leaks overlaid + the Salesforce write-back loop.
//
// MOCK DATA for the V1 dry run — descriptions are forward-looking; real
// clips + exact bucket sizes swap in for V2 post-Kenny feedback. The
// 0/332 reframe figure is a real measurement from the 332-call run.

type Leak = {
  category: string;
  title: string;
  what: string;
  why: string;
  stewart: string;
  bucket: string;
};

const LEAKS: Leak[] = [
  {
    category: "Motivation Leakage",
    title: "The bill is treated as paperwork, not motivation",
    what:
      "Across 332 processed calls, the schema's highest-leverage move — reframing the power bill as the reason to act — was executed in zero of them.",
    why:
      "Reps collect the bill as a procedural step. The number that should create urgency gets filed instead of used.",
    stewart:
      "Stewart flags every call where the bill was captured but never reframed, and shows managers the exact moment it should have happened.",
    bucket: "0 / 332 calls reframed",
  },
  {
    category: "Process Leakage",
    title: "Email-quote refusals quietly become dead leads",
    what:
      "When a prospect asks for a quote by email, the current policy says hold the line — and the lead goes cold instead of converting.",
    why:
      "A blanket policy can't read intent. Some email-askers are tire-kickers; some are ready buyers who just want it in writing.",
    stewart:
      "Stewart separates the two by what the customer actually meant, so managers stop losing the ready buyers to a one-size policy.",
    bucket: "Est. recoverable: a slice of every email-quote refusal",
  },
  {
    category: "Routing Leakage",
    title: "Hot leads get mishandled instead of escalated",
    what:
      "A buyer signals they're deciding this week — and the call ends with a generic follow-up instead of a manager handoff.",
    why:
      "The rep didn't recognize the buying signal in the moment. Nobody else heard the call, so nobody caught it.",
    stewart:
      "Stewart classifies the lead as hot and routes it to a manager recovery queue while it's still warm.",
    bucket: "Est. recoverable: mishandled hot leads / month",
  },
  {
    category: "Recovery Leakage",
    title: "The 30-day round-robin dumps context on the floor",
    what:
      "Unworked leads reset into the round-robin after 30 days — and whoever picks them up starts from zero, with no idea what already happened.",
    why:
      "The CRM keeps the contact record but loses the conversation. Every reset throws away what the floor already learned.",
    stewart:
      "Stewart writes the full conversation history back to Salesforce, so a reset lead arrives with its whole story attached.",
    bucket: "Est. recoverable: every reset lead's prior context",
  },
];

export function SectionLeakAtlas() {
  return (
    <SectionFrame
      id="leak-atlas"
      index={5}
      eyebrow="The Leak Atlas"
      title="This isn't a coaching problem. It's a management problem you can finally see."
      question="Where is the money leaking?"
      highlight={["Classify", "Route", "Remember"]}
    >
      <div className="grid md:grid-cols-2 gap-5">
        {LEAKS.map((leak) => (
          <LeakCard key={leak.category} leak={leak} />
        ))}
      </div>

      {/* Sales Machine V2 return — same machine, now showing the leaks. */}
      <div className="mt-16">
        <h3 className="text-xl sm:text-2xl font-bold text-stewart-text mb-5">
          Same machine. Here&apos;s where it leaks &mdash; and how Stewart
          catches it.
        </h3>
        <SalesMachine variant="leaks" />
        <p className="mt-4 text-base text-stewart-muted leading-relaxed max-w-3xl">
          The lead never disappears. It just gets placed where it has the
          best shot &mdash; and every time it&apos;s touched, the full
          conversation history is right there in Salesforce.
        </p>
      </div>
    </SectionFrame>
  );
}

function LeakCard({ leak }: { leak: Leak }) {
  return (
    <div className="rounded-xl border border-stewart-warning/30 bg-stewart-warning/5 p-5 sm:p-6">
      <p className="text-xs uppercase tracking-[0.15em] font-bold text-stewart-warning">
        {leak.category}
      </p>
      <h4 className="mt-2 text-lg font-bold text-stewart-text leading-snug">
        {leak.title}
      </h4>
      <dl className="mt-4 space-y-3 text-sm">
        <Row label="What happens" value={leak.what} />
        <Row label="Why" value={leak.why} />
        <Row label="How Stewart changes it" value={leak.stewart} accent />
      </dl>
      <p className="mt-4 pt-3 border-t border-stewart-warning/20 font-mono text-xs text-stewart-warning">
        {leak.bucket}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt
        className={
          "text-[11px] uppercase tracking-wider font-semibold mb-0.5 " +
          (accent ? "text-stewart-accent" : "text-stewart-muted")
        }
      >
        {label}
      </dt>
      <dd className="text-stewart-text leading-relaxed">{value}</dd>
    </div>
  );
}
