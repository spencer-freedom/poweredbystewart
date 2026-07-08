import { AtomHero } from "./_components/AtomHero.client";
import { AboutSpencer } from "./_components/AboutSpencer.client";
import { CupOfWater } from "./_components/CupOfWater.client";
import { SectionDiveDeeper } from "./_sections/SectionDiveDeeper";
import { SectionWhatIsStewart } from "./_sections/SectionWhatIsStewart";
import { SectionTheMiss } from "./_sections/SectionTheMiss";
import { SectionImagine } from "./_sections/SectionImagine";
import { SectionCoaching } from "./_sections/SectionCoaching";
import { SectionLeakAtlas } from "./_sections/SectionLeakAtlas";
import { SectionEconomics } from "./_sections/SectionEconomics";
import { SectionMorningView } from "./_sections/SectionMorningView";
import { SectionSowClose } from "./_sections/SectionSowClose";
import { SectionHowItWorks } from "./_sections/SectionHowItWorks";
import { SectionBrain } from "./_sections/SectionBrain";

export const dynamic = "force-dynamic";

// /ion/present — the single-page scroll Stewart pitch (Kenny + VP).
//
// Narrative rebuild (cup hook → pain → Stewart):
//   hero → about → cup of water (sell/telling/takeaways) → dive deeper
//   (reasons to buy) → WHAT is Stewart (pain: call review + coaching)
//   → [remaining sections below are the OLD pitch, pending rework]
//
// Parked at the very bottom for reference (not the transition we want yet):
//   SectionHowItWorks (Sales Machine + intent-vs-keyword), SectionBrain.
//   These carry the "how Stewart works" material for a later step.

export default function IonPresentPage() {
  return (
    <>
      <AtomHero />
      {/* Scroll down to "About Spencer" (dismissable), then the cup of water */}
      <AboutSpencer />
      <CupOfWater />
      <SectionDiveDeeper />
      {/* Clean break from the cup → Stewart (what it does + the pain) */}
      <SectionWhatIsStewart />
      {/* Proof: real Ion calls where both script anchors were dropped → 0/332 */}
      <SectionTheMiss />
      {/* The upside flip: set rate → sit rate → close */}
      <SectionImagine />
      {/* --- old pitch below, pending rework --- */}
      <SectionCoaching />
      <SectionLeakAtlas />
      <SectionEconomics />
      <SectionMorningView />
      <SectionSowClose />
      {/* --- parked for reference: "how it works" material, revisit later --- */}
      <SectionHowItWorks />
      <SectionBrain />
    </>
  );
}
