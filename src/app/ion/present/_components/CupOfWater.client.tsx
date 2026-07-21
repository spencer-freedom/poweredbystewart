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

// Three sellable segments (one per reason-to-buy), light → deep so they
// read as stacked layers.
const SEGMENTS = [
  "rgba(103,232,249,0.52)", // cyan
  "rgba(59,130,246,0.62)", // blue
  "rgba(37,99,235,0.68)", // deep blue
];

// Thin "skim" layer at the top of the water: leads Ion CAN sell but does
// NOT want to. Sits between the water surface and the four wanted-segment
// bands. Slate so it reads as sellable-but-set-aside, not blue water.
const SKIM_BOTTOM = 131;
const SKIM_COLOR = "rgba(148,163,184,0.5)";
const BAND_H = (BOTTOM - SKIM_BOTTOM) / 3;

// Amber highlight for whichever cup region a slide calls out.
const HL_FILL = "rgba(251,191,36,0.24)";
const HL_STROKE = "rgba(251,191,36,0.9)";

// Vertical [top, bottom] of a highlightable region, by key:
//   empty = the air (can't be sold), water = the whole sellable body,
//   skim = the slate layer (don't want),
//   seg0..seg3 = the four wanted reason-to-buy sections, top → bottom.
function highlightBounds(key?: string): [number, number] | null {
  switch (key) {
    case "empty":
      return [RIM_Y, FILL_TOP];
    case "water":
      return [FILL_TOP, BOTTOM];
    case "skim":
      return [FILL_TOP, SKIM_BOTTOM];
    case "seg0":
      return [SKIM_BOTTOM, SKIM_BOTTOM + BAND_H];
    case "seg1":
      return [SKIM_BOTTOM + BAND_H, SKIM_BOTTOM + 2 * BAND_H];
    case "seg2":
      return [SKIM_BOTTOM + 2 * BAND_H, BOTTOM];
    default:
      return null;
  }
}

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
      <>
        <p>It comes from one fear:</p>
        <p className="text-stewart-text font-medium">
          What if the person you are trying to sell it to doesn&apos;t want
          it?
        </p>
      </>
    ),
  },
  {
    title: "There are two important takeaways.",
    body: (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent">
            Takeaway 1
          </p>
          <p className="mt-1 text-stewart-text font-medium">
            They have to want it.
          </p>
          <p className="mt-1 text-base text-stewart-muted">
            We can only sell the cup of water to someone who{" "}
            <span className="text-stewart-text font-medium">
              actually wants to buy it.
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent">
            Takeaway 2
          </p>
          <p className="mt-1 text-stewart-text font-medium">
            Know why they want it.
          </p>
          <p className="mt-1 text-base text-stewart-muted">
            If we understand <span className="text-stewart-text font-medium">why</span> they
            want to buy it.
          </p>
          <p className="mt-1 text-base text-stewart-muted">
            We can do a much better job selling them the cup of water using
            their whys in our pitch.
          </p>
        </div>
      </div>
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
// the narrative — no section wrapper, so callers place it. `highlight`
// lets a caller call out a region (e.g. "empty" = the unsellable top).
export function SegmentedCup({
  highlight,
  labels,
}: {
  highlight?: string;
  labels?: string[];
}) {
  return (
    <GlassCup
      idPrefix="segmented-cup"
      segmented
      highlight={highlight}
      labels={labels}
    />
  );
}

function GlassCup({
  idPrefix,
  segmented,
  highlight,
  labels,
}: {
  idPrefix: string;
  segmented: boolean;
  highlight?: string;
  labels?: string[];
}) {
  const clipId = `${idPrefix}-glass-inner`;
  const bandH = BAND_H;

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
            {/* Skim layer — painted first, from the surface down; the
                sellable sections below overwrite it from SKIM_BOTTOM. */}
            <rect
              x="0"
              y={FILL_TOP}
              width="200"
              height={BOTTOM - FILL_TOP}
              fill={SKIM_COLOR}
            />
            <ellipse
              cx={CX}
              cy={FILL_TOP}
              rx={halfWidth(FILL_TOP)}
              ry="6"
              fill={SKIM_COLOR}
            />
            {/* Four wanted segments below the skim */}
            {SEGMENTS.map((color, i) => {
              const topY = SKIM_BOTTOM + i * bandH;
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
            {/* Curved oval lines: surface, skim boundary, section tops */}
            {[
              FILL_TOP,
              ...SEGMENTS.map((_, i) => SKIM_BOTTOM + i * bandH),
            ].map((y, i) => (
              <ellipse
                key={`line-${i}`}
                cx={CX}
                cy={y}
                rx={halfWidth(y)}
                ry="6"
                fill="none"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="1.3"
              />
            ))}
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

      {/* Region highlight — amber, pulsing, drawn on top of whichever region
          the current slide calls out (air / skim / one of the 4 sections). */}
      {(() => {
        const bounds = highlightBounds(highlight);
        if (!bounds) return null;
        const [topY, botY] = bounds;
        return (
          <g className="animate-pulse">
            <g clipPath={`url(#${clipId})`}>
              <rect
                x="0"
                y={topY}
                width="200"
                height={botY - topY}
                fill={HL_FILL}
              />
            </g>
            {/* Top ring of the highlighted region */}
            <ellipse
              cx={CX}
              cy={topY}
              rx={halfWidth(topY)}
              ry="6"
              fill="none"
              stroke={HL_STROKE}
              strokeWidth="2"
            />
            {/* Bottom ring — skipped when the region reaches the base, so
                there's no ring sitting under the cup. */}
            {botY < BOTTOM - 1 ? (
              <ellipse
                cx={CX}
                cy={botY}
                rx={halfWidth(botY)}
                ry="6"
                fill="none"
                stroke={HL_STROKE}
                strokeWidth="2"
              />
            ) : null}
            {/* Whole-water highlight: trace the entire water body in amber. A
                uniform fill over the full body has no neighboring un-lit water
                to contrast against, so it washes out — the silhouette outline
                makes "the whole cup" unmistakably light up. */}
            {highlight === "water" ? (
              <path
                d={`M${CX - halfWidth(FILL_TOP)} ${FILL_TOP} L${BASE_LX} ${JUNC_Y} Q${BASE_LX} ${BASE_Y} ${CX} ${BASE_Y} Q${200 - BASE_LX} ${BASE_Y} ${200 - BASE_LX} ${JUNC_Y} L${CX + halfWidth(FILL_TOP)} ${FILL_TOP}`}
                fill="none"
                stroke={HL_STROKE}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </g>
        );
      })()}

      {/* Section labels — one per wanted segment (e.g. Utility bill). White
          with a dark outline so they read on any band. */}
      {segmented && labels
        ? labels.map((lbl, i) => (
            <text
              key={i}
              x={CX}
              y={SKIM_BOTTOM + (i + 0.5) * BAND_H}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fontWeight="700"
              fill="#ffffff"
              stroke="rgba(2,6,23,0.6)"
              strokeWidth="2.5"
              paintOrder="stroke"
              style={{ pointerEvents: "none" }}
            >
              {lbl}
            </text>
          ))
        : null}
    </svg>
  );
}
