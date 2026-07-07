"use client";

import { SlideStepper, type Slide } from "./SlideStepper.client";

// The cup of water — Moment 1, reframed as a lead-funnel metaphor.
//
// A whisky-tumbler glass 75% full. The EMPTY space at the top is the share
// that can't be sold — DQ, no interest, never answer the phone. The WATER
// is the sellable share. Two cups, before/after:
//   • Before — how Ion sees a lead today: just a cup of water.
//   • After  — how Stewart sees it: the same water, broken into the
//     buyer-motivation segments (why they want it / why they'll buy).
//
// Not a pie chart — a "cup chart." Segment labels are placeholders until
// Spencer names the four buyer-motivation segments.

// ── Tumbler geometry (long tumbler: tall, wide, slight taper, rounded base) ──
const CX = 100; // horizontal center
const RIM_Y = 30; // top rim
const JUNC_Y = 295; // where the straight side meets the rounded bottom
const BASE_Y = 338; // deepest point of the rounded bottom
const TOP_LX = 36; // left edge x at the rim
const BASE_LX = 46; // left edge x where side meets the rounded bottom
const FILL_TOP = 107; // 75%-full water surface
const BOTTOM = 338;

// Glass interior half-width at a given depth, so the water surface and the
// section dividers curve with the taper instead of reading as flat lines.
function halfWidth(y: number): number {
  const lx = TOP_LX + ((BASE_LX - TOP_LX) * (y - RIM_Y)) / (JUNC_Y - RIM_Y);
  return CX - lx;
}

const GLASS_BODY =
  "M36 30 L46 295 Q46 338 100 338 Q154 338 154 295 L164 30 Z";
const GLASS_OUTLINE =
  "M36 30 L46 295 Q46 338 100 338 Q154 338 154 295 L164 30";

// Four sellable segments, light → deep so they read as stacked layers.
const SEGMENTS = [
  "rgba(103,232,249,0.52)", // cyan
  "rgba(56,189,248,0.58)", // sky
  "rgba(59,130,246,0.62)", // blue
  "rgba(37,99,235,0.68)", // deep blue
];

// Moment 1 — the simple cup, offset left, with a click-to-advance text box
// on its right: "Sell me this cup of water" → "Telling isn't selling."
const CUP_SLIDES: Slide[] = [
  { title: "Sell me this cup of water." },
  {
    title: "Telling isn't selling.",
    body: (
      <>
        <p>
          Hand someone this cup of water and tell them to sell it, and most
          people panic.
        </p>
        <p>
          Then they reach for every flowery way to describe it — how pure it
          is, how crisp, how refreshing.
        </p>
        <p className="text-stewart-text font-medium">
          Soon there&apos;s a lot of telling. And very little selling.
        </p>
      </>
    ),
  },
  {
    title: "But the panic was never about the water.",
    body: (
      <p>
        It comes from one fear: that the person you&apos;re supposed to sell
        to{" "}
        <span className="text-stewart-text font-medium">
          doesn&apos;t want to buy it.
        </span>
      </p>
    ),
  },
];

export function CupOfWater() {
  return (
    <section className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-20 border-b border-white/10">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 max-w-5xl">
        <GlassCup idPrefix="hero-cup" segmented={false} />
        <SlideStepper slides={CUP_SLIDES} />
      </div>
    </section>
  );
}

// The segmented "cup chart" as a standalone visual (empty top = can't be
// sold; the water = the sellable share, split by why they buy). Reused in
// the narrative — no section wrapper, so callers place it.
export function SegmentedCup() {
  return <GlassCup idPrefix="segmented-cup" segmented />;
}

function GlassCup({
  idPrefix,
  segmented,
}: {
  idPrefix: string;
  segmented: boolean;
}) {
  const clipId = `${idPrefix}-glass-inner`;
  const bandH = (BOTTOM - FILL_TOP) / 4;

  return (
    <svg
      viewBox="0 0 200 360"
      className="h-[55vh] w-auto max-w-[42vw] sm:max-w-[34vw]"
      role="img"
      aria-label={
        segmented ? "Cup chart with four sellable segments" : "A cup of water"
      }
    >
      <defs>
        <clipPath id={clipId}>
          <path d={GLASS_BODY} />
        </clipPath>
      </defs>

      {/* Faint glass body (no stroke → flat top edge stays invisible) */}
      <path d={GLASS_BODY} fill="rgba(226,232,240,0.04)" />

      {/* Water, clipped to the glass interior. Each layer is a rect capped
          by an ellipse so every boundary (surface + dividers) is a curved
          oval, never a flat horizontal line. Layers are painted top→bottom
          so each lower color overwrites from its own curved cap down. */}
      <g clipPath={`url(#${clipId})`}>
        {segmented ? (
          <>
            {SEGMENTS.map((color, i) => {
              const topY = FILL_TOP + i * bandH;
              return (
                <g key={i}>
                  <rect
                    x="0"
                    y={topY}
                    width="200"
                    height={BOTTOM - topY}
                    fill={color}
                  />
                  <ellipse
                    cx={CX}
                    cy={topY}
                    rx={halfWidth(topY)}
                    ry="6"
                    fill={color}
                  />
                </g>
              );
            })}
            {/* Curved oval lines on the surface + each divider */}
            {SEGMENTS.map((_, i) => {
              const topY = FILL_TOP + i * bandH;
              return (
                <ellipse
                  key={`line-${i}`}
                  cx={CX}
                  cy={topY}
                  rx={halfWidth(topY)}
                  ry="6"
                  fill="none"
                  stroke="rgba(255,255,255,0.28)"
                  strokeWidth="1.3"
                />
              );
            })}
          </>
        ) : (
          <>
            <rect
              x="0"
              y={FILL_TOP}
              width="200"
              height={BOTTOM - FILL_TOP}
              fill="rgba(59,130,246,0.46)"
            />
            <ellipse
              cx={CX}
              cy={FILL_TOP}
              rx={halfWidth(FILL_TOP)}
              ry="6"
              fill="rgba(59,130,246,0.46)"
            />
            <ellipse
              cx={CX}
              cy={FILL_TOP}
              rx={halfWidth(FILL_TOP)}
              ry="6"
              fill="none"
              stroke="rgba(147,197,253,0.5)"
              strokeWidth="1.3"
            />
          </>
        )}
      </g>

      {/* Glass outline — sides + heavy rounded base, open top */}
      <path
        d={GLASS_OUTLINE}
        fill="none"
        stroke="rgba(226,232,240,0.55)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Rim — the open top */}
      <ellipse
        cx={CX}
        cy={RIM_Y}
        rx={halfWidth(RIM_Y)}
        ry="8"
        fill="none"
        stroke="rgba(226,232,240,0.65)"
        strokeWidth="2.5"
      />
    </svg>
  );
}
