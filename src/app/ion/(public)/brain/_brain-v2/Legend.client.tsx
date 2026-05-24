"use client";

// V2.0.14 — anatomy legend (replaces the 13-domain swatch key).
// First-time viewers need to understand WHAT they're looking at
// before WHAT each color means. The domain meanings still encode in
// the moon colors; the dedicated codex page at /ion/codex covers
// the per-domain semantics in depth.
//
// Domain hover-to-highlight was tied to the old legend and goes away
// with it for now. Easy to re-add if Spencer wants it back as a
// secondary key later — re-introduce hoveredDomain state in
// BrainPageShell and a second legend strip.

type LegendItem = {
  label: string;
  description: string;
  swatch: React.ReactNode;
};

function CoreSwatch() {
  return (
    <span
      className="w-3 h-3 rounded-full shrink-0"
      style={{
        background:
          "radial-gradient(circle at 30% 30%, #fff8ec 0%, #d4b896 55%, #8b6f47 100%)",
      }}
    />
  );
}

function TileSwatch() {
  return (
    <span
      className="w-3 h-3 shrink-0 rounded-[2px]"
      style={{
        background:
          "linear-gradient(135deg, #9db8d8 0%, #74e683 50%, #e69a4d 100%)",
      }}
    />
  );
}

function CallSwatch() {
  return (
    <span
      className="w-3 h-3 rounded-full shrink-0"
      style={{ background: "#8b5a2b", boxShadow: "0 0 4px #8b5a2b" }}
    />
  );
}

function MoonSwatch() {
  return (
    <span
      className="w-2.5 h-2.5 rounded-full shrink-0"
      style={{ background: "#e65c5c", boxShadow: "0 0 6px #e65c5c" }}
    />
  );
}

function GraySwatch() {
  return (
    <span className="relative inline-flex w-3 h-3 shrink-0">
      <span
        className="absolute inset-[-2px] rounded-full"
        style={{ background: "#fde68a", opacity: 0.35 }}
      />
      <span
        className="relative w-3 h-3 rounded-full"
        style={{ background: "#fbbf24", boxShadow: "0 0 6px #fbbf24" }}
      />
    </span>
  );
}

function VectorSwatch() {
  return (
    <span className="w-4 h-3 shrink-0 inline-flex items-center">
      <span
        className="w-full h-px"
        style={{ background: "#e2e8f0", opacity: 0.7 }}
      />
    </span>
  );
}

function OrbitSwatch() {
  return (
    <span
      className="w-3 h-3 shrink-0 rounded-full border"
      style={{ borderColor: "#b67ce6", opacity: 0.55 }}
    />
  );
}

const ITEMS: LegendItem[] = [
  {
    label: "Crystal core",
    description: "Your codex. The hard layer. Doesn't change unless you change it.",
    swatch: <CoreSwatch />,
  },
  {
    label: "Codex tile",
    description: "One codex section colored by domain. 101 tiles light up across the core.",
    swatch: <TileSwatch />,
  },
  {
    label: "Call planet",
    description: "One of the 332 processed Ion calls. The nucleus of its own atom.",
    swatch: <CallSwatch />,
  },
  {
    label: "Moon (ion)",
    description: "One cherry-pick moment from that call. Colored by which codex domain it touched.",
    swatch: <MoonSwatch />,
  },
  {
    label: "Orbit path",
    description: "The trace each ion follows around its call. Different inclinations per moon.",
    swatch: <OrbitSwatch />,
  },
  {
    label: "Gray-matter exemplar",
    description: "Kenny-validated “what good looks like” call. Stuck near its codex section.",
    swatch: <GraySwatch />,
  },
  {
    label: "Grounding vector",
    description: "Tether from each call back to the codex.",
    swatch: <VectorSwatch />,
  },
];

export function Legend() {
  return (
    <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-[28rem] z-20 pointer-events-auto">
      <div className="bg-stewart-bg/85 backdrop-blur-sm border border-stewart-border rounded-lg px-3 py-2 space-y-1.5">
        <p className="text-[9px] uppercase tracking-wider font-mono text-stewart-muted">
          Anatomy of Stewart&apos;s brain
        </p>
        <ul className="space-y-1">
          {ITEMS.map((item) => (
            <li
              key={item.label}
              className="flex items-baseline gap-2.5 text-[11px] leading-snug"
            >
              <span className="flex items-center h-3.5 shrink-0">
                {item.swatch}
              </span>
              <span className="text-stewart-text font-semibold whitespace-nowrap">
                {item.label}
              </span>
              <span className="text-stewart-muted">{item.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
