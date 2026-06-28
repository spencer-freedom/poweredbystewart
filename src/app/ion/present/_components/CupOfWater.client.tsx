"use client";

import { useState } from "react";

// The cup of water — Moment 1, the pitch's philosophical frame ("sell me
// this cup of water… but I'm not actually going to make you"). Sits right
// after About Spencer, with deliberate breathing room on black.
//
// Drop a real photo at public/ion/cup-of-water.jpg and it shows
// automatically; until then an elegant SVG glass renders as the fallback
// so nothing ever looks broken.
const PHOTO_SRC = "/ion/cup-of-water.jpg";

export function CupOfWater() {
  const [usePhoto, setUsePhoto] = useState(true);

  return (
    <section className="relative bg-black min-h-[100svh] flex flex-col items-center justify-center px-6 py-20 border-b border-white/10">
      <div className="w-full max-w-sm flex items-center justify-center">
        {usePhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={PHOTO_SRC}
            alt="A cup of water"
            onError={() => setUsePhoto(false)}
            className="max-h-[60vh] w-auto rounded-xl object-contain"
          />
        ) : (
          <GlassOfWater />
        )}
      </div>
      <p className="mt-10 text-sm italic text-stewart-muted text-center max-w-md">
        Sell me this cup of water.
      </p>
    </section>
  );
}

// Self-contained SVG fallback — a simple glass with water.
function GlassOfWater() {
  return (
    <svg
      viewBox="0 0 160 220"
      className="w-48 h-auto"
      role="img"
      aria-label="A glass of water"
    >
      {/* Glass body — slightly tapered tumbler */}
      <path
        d="M40 20 L120 20 L110 200 Q110 210 100 210 L60 210 Q50 210 50 200 Z"
        fill="rgba(226,232,240,0.04)"
        stroke="rgba(226,232,240,0.5)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Water fill (~65%) */}
      <path
        d="M47 80 L113 80 L110 200 Q110 210 100 210 L60 210 Q50 210 50 200 Z"
        fill="rgba(59,130,246,0.28)"
      />
      {/* Water surface */}
      <ellipse
        cx="80"
        cy="80"
        rx="33"
        ry="6"
        fill="rgba(59,130,246,0.45)"
        stroke="rgba(147,197,253,0.6)"
        strokeWidth="1.5"
      />
      {/* Rim */}
      <ellipse
        cx="80"
        cy="20"
        rx="40"
        ry="7"
        fill="none"
        stroke="rgba(226,232,240,0.6)"
        strokeWidth="2"
      />
      {/* Highlight */}
      <path
        d="M58 35 Q54 120 64 195"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
