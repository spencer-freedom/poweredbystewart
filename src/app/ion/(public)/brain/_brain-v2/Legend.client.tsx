"use client";

// V2.0.14 — anatomy legend (replaces the 13-domain swatch key).
// First-time viewers need to understand WHAT they're looking at
// before WHAT each color means. The domain meanings still encode in
// the moon colors; the dedicated schema page at /ion/schema covers
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
    description: "Your schema. The hard layer. Doesn't change unless you change it.",
    swatch: <CoreSwatch />,
  },
  {
    label: "Schema tile",
    description: "One schema section colored by domain. 101 tiles light up across the core.",
    swatch: <TileSwatch />,
  },
  {
    label: "Call planet",
    description: "One of the 332 processed Ion calls. The nucleus of its own atom.",
    swatch: <CallSwatch />,
  },
  {
    label: "Moon (ion)",
    description: "One cherry-pick moment from that call. Colored by which schema domain it touched.",
    swatch: <MoonSwatch />,
  },
  {
    label: "Orbit path",
    description: "The trace each ion follows around its call. Different inclinations per moon.",
    swatch: <OrbitSwatch />,
  },
  {
    label: "Gray-matter exemplar",
    description: "Kenny-validated “what good looks like” call. Stuck near its schema section.",
    swatch: <GraySwatch />,
  },
  {
    label: "Grounding vector",
    description: "Tether from each call back to the schema.",
    swatch: <VectorSwatch />,
  },
];

// V2.1.5 — Legend lives in the page flow above the brain canvas
// (not as an overlay inside it). Plus a one-line "click the center of
// any atom for Stewart's full read" hint footer.

export function Legend() {
  return (
    <div className="w-full bg-stewart-card/50 border border-stewart-border rounded-lg px-4 py-3 space-y-2">
      <p className="text-[10px] uppercase tracking-wider font-mono text-stewart-muted">
        Anatomy of Stewart&apos;s brain
      </p>
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-1.5">
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
      <p className="pt-2 border-t border-stewart-border/60 text-[11px] leading-snug text-stewart-muted">
        <span className="text-stewart-accent font-semibold">
          Click the center of any atom
        </span>{" "}
        &mdash; the call planet at the heart of each orbit &mdash; to
        see Stewart&apos;s full breakdown of that call and listen to
        the cherry-pick clips.
      </p>
  );
}
