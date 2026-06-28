import { AtomHero } from "./_components/AtomHero.client";
import { AboutSpencer } from "./_components/AboutSpencer.client";
import { CupOfWater } from "./_components/CupOfWater.client";
import { SectionHowItWorks } from "./_sections/SectionHowItWorks";
import { SectionBrain } from "./_sections/SectionBrain";
import { SectionCoaching } from "./_sections/SectionCoaching";
import { SectionLeakAtlas } from "./_sections/SectionLeakAtlas";
import { SectionEconomics } from "./_sections/SectionEconomics";
import { SectionMorningView } from "./_sections/SectionMorningView";
import { SectionSowClose } from "./_sections/SectionSowClose";

export const dynamic = "force-dynamic";

// /ion/present — the single-page scroll Stewart pitch (Kenny + VP).
//
//  #1 hero            — moving atom + dismissible About-Spencer card
//  #2 how-stewart-works — Sales Machine + intent-vs-keyword + critic
//  #3 brain           — inline brain embed
//  #4 coaching        — first-call clip + heat map
//  #5 leak-atlas      — 4 leaks + Sales Machine return
//  #6 economics       — interactive ROI calculator
//  #7 morning-view    — /ion/manager iframe in a phone frame
//  #8 sow             — scope of work + close (#close anchor)

export default function IonPresentPage() {
  return (
    <>
      <AtomHero />
      {/* Scroll down to "About Spencer" (dismissable), then the cup of water */}
      <AboutSpencer />
      <CupOfWater />
      <SectionHowItWorks />
      {/* Brain is an async server component (loads payload) */}
      <SectionBrain />
      <SectionCoaching />
      <SectionLeakAtlas />
      <SectionEconomics />
      <SectionMorningView />
      <SectionSowClose />
    </>
  );
}
