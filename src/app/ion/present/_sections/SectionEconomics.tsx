import { SectionFrame } from "../_components/SectionFrame";
import { RoiCalculator } from "../_components/RoiCalculator.client";

// Build #6 — The Economics (~3:30). The interactive ROI calculator does
// the work; the section just frames it for both buyers at once.

export function SectionEconomics() {
  return (
    <SectionFrame
      id="economics"
      index={6}
      eyebrow="The Economics"
      title="The leads are bought. The question is what you recover."
      question="Is the economics meaningful?"
      highlight="Remember"
    >
      <p className="text-base text-stewart-muted leading-relaxed max-w-3xl mb-8">
        Every dollar below is paired with an opportunity count &mdash; the
        same result, read two ways. Move the sliders.
      </p>
      <RoiCalculator />
    </SectionFrame>
  );
}
