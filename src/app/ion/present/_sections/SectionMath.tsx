import { Bridge } from "../_components/Bridge";
import { IonMath } from "../_components/IonMath.client";

// The economics, in Ion's own units. One slider, two readouts.

export function SectionMath() {
  return (
    <section
      id="math"
      className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-24 border-b border-white/10 scroll-mt-20"
    >
      <div className="max-w-3xl w-full">
        <Bridge>
          So what&apos;s it worth? Kenny reads this in appointments. The VP
          reads it in dollars. Same slider.
        </Bridge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          One more appointment per setter, per week.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-stewart-muted leading-relaxed">
          That&apos;s the whole bet. Not a new lead source, not a new script
          &mdash; the calls you already have, with the reason the customer
          already gave you, used.
        </p>

        <div className="mt-10">
          <IonMath />
        </div>
      </div>
    </section>
  );
}
