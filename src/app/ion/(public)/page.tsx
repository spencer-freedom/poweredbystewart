import { Section1CustomBuilt } from "./_sections/Section1CustomBuilt";
import { Section2CallWalkthrough } from "./_sections/Section2CallWalkthrough";
import { Section3Maturation } from "./_sections/Section3Maturation";
import { Section4Brain } from "./_sections/Section4Brain";
import { Section5Thesis } from "./_sections/Section5Thesis";
import { Section6Cta } from "./_sections/Section6Cta";

export const dynamic = "force-dynamic";

// The /ion scroll page is a thin composer — each section owns its own
// layout, copy, and headings in _sections/. ScrollSection is the shared
// wrapper that provides the anchor id (#custom-built, #how-a-call-
// processes, #maturation, #brain, #thesis, #next) and the vertical
// rhythm between sections.

export default function IonScrollPage() {
  return (
    <div className="space-y-0">
      <Section1CustomBuilt />
      <Section2CallWalkthrough />
      <Section3Maturation />
      <Section4Brain />
      <Section5Thesis />
      <Section6Cta />
    </div>
  );
}
