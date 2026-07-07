import { SegmentedCup } from "../_components/CupOfWater.client";
import { SlideStepper, type Slide } from "../_components/SlideStepper.client";

// The pivot, as a click-to-advance "slide": the sectioned cup stays put
// while the text box cycles through the beats. Step 1 is Spencer's line;
// step 2 is a draft to be replaced with his real copy.
const FEAR_SLIDES: Slide[] = [
  {
    // DRAFT — replace with Spencer's real copy for the sectioned-cup beat.
    title: "So the great ones stop telling.",
    body: (
      <p>
        They listen for the reason this person{" "}
        <span className="text-stewart-text font-medium">already</span> wants
        it — and sell to that.
      </p>
    ),
  },
];

export function SectionRealFear() {
  return (
    <section className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-20 border-b border-white/10">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 max-w-5xl">
        <SegmentedCup />
        <SlideStepper slides={FEAR_SLIDES} />
      </div>
    </section>
  );
}
