import { ScrollSection } from "./ScrollSection";
import { RoiCalculator } from "../_components/RoiCalculator.client";

export function Section5Thesis() {
  return (
    <ScrollSection id="thesis">
      <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
        The thesis
      </p>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight max-w-4xl">
        Stewart doesn&apos;t get you more leads. It makes the leads you
        already have worth more.
      </h2>

      <p className="mt-4 text-xl text-stewart-accent font-medium max-w-3xl">
        That margin scales better than buying more leads.
      </p>

      <div className="mt-8 space-y-5 text-lg text-stewart-muted leading-relaxed max-w-3xl">
        <p>
          Cost per acquisition climbs every quarter. The marginal lead is
          more expensive than the last. The cheapest revenue you can add
          is conversion lift on leads you&apos;ve already paid for.
        </p>
        <p>
          Coaching gaps Stewart catches compound. Rep improves &rarr; all
          their future calls benefit, not just the one Stewart flagged.
          The gap closes once. The recovered revenue is permanent.
        </p>
      </div>

      {/* THE BOMBSHELL */}
      <div className="mt-16 relative rounded-xl border-2 border-stewart-accent bg-gradient-to-br from-stewart-accent/15 via-stewart-bg to-stewart-bg p-8 sm:p-12">
        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent mb-6">
          The Bombshell
        </p>
        <div className="space-y-6 max-w-3xl">
          <p className="text-2xl sm:text-3xl font-bold text-stewart-text leading-tight">
            Stewart read 332 of your calls.
          </p>
          <p className="text-xl sm:text-2xl text-stewart-text leading-snug">
            The schema&apos;s highest-leverage coaching move &mdash; the{" "}
            <span className="text-stewart-accent font-semibold">
              bill-as-villain inversion
            </span>{" "}
            &mdash; was executed{" "}
            <span className="text-stewart-warning font-bold">zero times.</span>
          </p>
          <p className="text-lg text-stewart-muted leading-relaxed">
            Your script says it&apos;s the #1 move. Your floor never does
            it. That&apos;s not coaching for one rep. That&apos;s a
            floor-wide training gap nobody has time to discover manually.
          </p>
          <p className="text-xl sm:text-2xl font-bold text-stewart-text leading-snug pt-2 border-t border-stewart-border">
            Stewart found it in{" "}
            <span className="text-stewart-success">$128 of compute.</span>
          </p>
        </div>
      </div>

      {/* SPENCER'S CATCH */}
      <div className="mt-10 rounded-lg border border-stewart-border bg-stewart-card p-6 sm:p-8 max-w-4xl">
        <p className="text-xs uppercase tracking-wider font-semibold text-stewart-warning mb-3">
          Spencer&apos;s catch &middot; 13 years in sales, watching his son
          onboard at Ion
        </p>
        <blockquote className="text-base sm:text-lg text-stewart-text italic leading-relaxed border-l-2 border-stewart-warning pl-4">
          &ldquo;I noticed reps using &lsquo;kinda&rsquo; to soften direct
          statements. It sounds unprofessional &mdash; like the rep
          isn&apos;t sure of what they&apos;re selling. My son started
          doing it at Ion. I told him to stop. The quality of the call
          goes way up when you drop it. So does the rep&apos;s
          confidence.&rdquo;
        </blockquote>

        <p className="mt-6 text-sm uppercase tracking-wider text-stewart-muted mb-3">
          Stewart counted across all 332 calls
        </p>
        <ul className="space-y-2 text-sm sm:text-base text-stewart-text leading-relaxed">
          <li className="flex gap-3">
            <span className="text-stewart-accent mt-1">&bull;</span>
            <span>
              <strong className="text-stewart-warning">
                314 rep instances
              </strong>{" "}
              of &ldquo;kinda&rdquo; or &ldquo;kind of&rdquo; &mdash;
              roughly one every 7 minutes of rep talk time
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-stewart-accent mt-1">&bull;</span>
            <span>
              <strong className="text-stewart-warning">Parker</strong> is
              the top offender &mdash; 74 instances across 26 calls (6.11
              per 1K words)
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-stewart-accent mt-1">&bull;</span>
            <span>
              Parker&apos;s worst single call: 12 softener moments in 9
              minutes
            </span>
          </li>
        </ul>

        <p className="mt-6 text-sm text-stewart-muted leading-relaxed">
          Spencer noticed the pattern. Stewart turned it into ammunition
          Kenny can use in tomorrow&apos;s 1-on-1.
        </p>
      </div>

      {/* ROI CALCULATOR — interactive, real-time math */}
      <div className="mt-12 max-w-4xl">
        <RoiCalculator />
      </div>

      <p className="mt-12 text-xl sm:text-2xl text-stewart-text font-medium leading-snug max-w-3xl">
        These are two of the things Stewart found in your data. There are
        more.
      </p>
    </ScrollSection>
  );
}
