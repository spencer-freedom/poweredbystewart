import { AtomHero } from "./_components/AtomHero.client";
import { HashHighlight } from "./_components/HashHighlight.client";
import { ProgressRail, type Beat } from "./_components/ProgressRail.client";
import { AboutSpencer } from "./_components/AboutSpencer.client";
import { CupOfWater } from "./_components/CupOfWater.client";
import { SectionDiveDeeper } from "./_sections/SectionDiveDeeper";
import { SectionWhatIsStewart } from "./_sections/SectionWhatIsStewart";
import { SectionMeaning } from "./_sections/SectionMeaning";
import { SectionTheMiss } from "./_sections/SectionTheMiss";
import { SectionImagine } from "./_sections/SectionImagine";
import { SectionAllCalls } from "./_sections/SectionAllCalls";
import { SectionScriptFloor } from "./_sections/SectionScriptFloor";
import { SectionBillAndObjections } from "./_sections/SectionBillAndObjections";
import { SectionOneRead } from "./_sections/SectionOneRead";
import { SectionMorning } from "./_sections/SectionMorning";
import { SectionMath } from "./_sections/SectionMath";
import { SectionRepsNext } from "./_sections/SectionRepsNext";
import { SectionWithWhatIHad } from "./_sections/SectionWithWhatIHad";
import { SectionAsk } from "./_sections/SectionAsk";
import { SectionGoDeeper } from "./_sections/SectionGoDeeper";

export const dynamic = "force-dynamic";

// /ion/present — the single-page scroll Stewart pitch (Kenny + VP).
// Built to be sent as a URL and walked alone: every beat is one full
// screen, the steppers show their own Next, the rail on the right says
// where you are, and a Bridge line at the top of each back-half beat
// says what Spencer would say between them.
//
// One spine, start to finish:
//   the cup (they have to want it; know why) → speak to the reason they
//   gave you → what Stewart does → meaning, not keywords → the miss
//   (your calls, measured) → imagine the opposite → Stewart read all of them
//   → your script across the floor → one read, all the way through → what a manager opens → the math
//   → what I had vs. what the connection unlocks → the ask → go deeper.

const BEATS: Beat[] = [
  { id: "hero", label: "Ion" },
  { id: "about", label: "Spencer" },
  { id: "cup", label: "The cup" },
  { id: "reasons", label: "The reasons" },
  { id: "stewart", label: "Stewart" },
  { id: "meaning", label: "Meaning" },
  { id: "proof", label: "Your calls" },
  { id: "imagine", label: "Imagine" },
  { id: "all-calls", label: "All calls" },
  { id: "floor", label: "Your script" },
  { id: "bill", label: "The bill" },
  { id: "one-read", label: "One read" },
  { id: "morning", label: "The morning" },
  { id: "math", label: "The math" },
  { id: "reps", label: "The reps" },
  { id: "inputs", label: "What I had" },
  { id: "ask", label: "The ask" },
  { id: "deeper", label: "Go deeper" },
];

export default function IonPresentPage() {
  return (
    <>
      <HashHighlight />
      <ProgressRail beats={BEATS} />
      <AtomHero />
      <AboutSpencer />
      <CupOfWater />
      <SectionDiveDeeper />
      <SectionWhatIsStewart />
      <SectionMeaning />
      <SectionTheMiss />
      <SectionImagine />
      <SectionAllCalls />
      <SectionScriptFloor />
      <SectionBillAndObjections />
      <SectionOneRead />
      <SectionMorning />
      <SectionMath />
      <SectionRepsNext />
      <SectionWithWhatIHad />
      <SectionAsk />
      <SectionGoDeeper />
    </>
  );
}
