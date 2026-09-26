import { HashHighlight } from "../present/_components/HashHighlight.client";
import { ProgressRail, type Beat } from "../present/_components/ProgressRail.client";
import { HeroDirect } from "./_sections/HeroDirect";
import { SectionYourScript } from "./_sections/SectionYourScript";
import { SectionMisses } from "./_sections/SectionMisses";
import { SectionOneRead } from "../present/_sections/SectionOneRead";
import { SectionAllCalls } from "../present/_sections/SectionAllCalls";
import { SectionScriptFloor } from "../present/_sections/SectionScriptFloor";
import { SectionBillAndObjections } from "../present/_sections/SectionBillAndObjections";
import { SectionMorning } from "../present/_sections/SectionMorning";
import { SectionLeadsGlance } from "./_sections/SectionLeadsGlance";
import { SectionMath } from "../present/_sections/SectionMath";
import { SectionRepsNext } from "../present/_sections/SectionRepsNext";
import { SectionWithWhatIHad } from "../present/_sections/SectionWithWhatIHad";
import { SectionAsk } from "../present/_sections/SectionAsk";
import { SectionGoDeeper } from "../present/_sections/SectionGoDeeper";

export const dynamic = "force-dynamic";

// /ion/presentation — the direct cut. Built beside /ion/present, which is
// untouched. One spine: your script → one call read against it → all of
// them → where it leaks → the bill and the objections → what a manager
// opens → every lead in a bucket → the math → the reps → what I had →
// the ask. No metaphor; the read is the pitch.

const BEATS: Beat[] = [
  { id: "hero", label: "Stewart" },
  { id: "script", label: "Your script" },
  { id: "one-read", label: "One call, right" },
  { id: "misses", label: "Where it goes wrong" },
  { id: "all-calls", label: "All calls" },
  { id: "floor", label: "Where it leaks" },
  { id: "bill", label: "The bill" },
  { id: "morning", label: "The morning" },
  { id: "leads", label: "Leads" },
  { id: "math", label: "The math" },
  { id: "reps", label: "The reps" },
  { id: "inputs", label: "What I had" },
  { id: "ask", label: "The ask" },
  { id: "deeper", label: "Go deeper" },
];

export default function IonPresentationPage() {
  return (
    <>
      <HashHighlight />
      <ProgressRail beats={BEATS} />
      <HeroDirect />
      <SectionYourScript />
      <SectionOneRead
        callId="30000547525"
        rep="Carter"
        title="One call, done right, read all the way through."
        bridge="Here's a call where the script ran — twelve of thirteen sections, two objections handled, bill in hand. Read against your script, every claim on the tape."
      />
      <SectionMisses />
      <SectionAllCalls bridge="One call done right, four that weren't. Stewart read all of them the same way — nobody picked." />
      <SectionScriptFloor bridge="So here's your script across the whole floor, and by rep. Counts, not opinions." />
      <SectionBillAndObjections bridge="Two more things nobody at Ion has been able to count. Same calls." />
      <SectionMorning bridge="Your managers don't read 300 of those. They open this." />
      <SectionLeadsGlance />
      <SectionMath bridge="So what's it worth? Kenny reads this in appointments. The VP reads it in dollars. Same slider." />
      <SectionRepsNext bridge="That was the manager math. The bigger number is one step further, and the order matters." />
      <SectionWithWhatIHad bridge="Everything you just scrolled through was built from a folder of recordings and a script. That's worth being clear about." />
      <SectionAsk />
      <SectionGoDeeper />
    </>
  );
}
