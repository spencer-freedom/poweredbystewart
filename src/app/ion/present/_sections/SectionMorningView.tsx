import { SectionFrame } from "../_components/SectionFrame";

// Build #7 — Daily Morning View (~1:30). In-scroll iframe pointing at the
// dedicated /ion/manager page (same embed approach as the Brain). Shown
// inside a phone frame to read as the mobile surface it is. Spencer can
// also hold up his phone on the same URL for a live device demo.

export function SectionMorningView() {
  return (
    <SectionFrame
      id="morning-view"
      index={7}
      eyebrow="The Daily Morning View"
      title="What a manager actually opens in the morning."
      question="How would my managers actually use this?"
      highlight="Remember"
    >
      <p className="text-base text-stewart-muted leading-relaxed max-w-3xl mb-8">
        Not a dashboard to study &mdash; a short list to act on. Stewart
        surfaces only the calls worth a manager&apos;s time and gets out of
        the way. It looks boring on purpose: it&apos;s an extension of the
        CRM your managers already live in.
      </p>

      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Phone frame around the live /ion/manager iframe */}
        <div className="mx-auto lg:mx-0 shrink-0">
          <div className="rounded-[2.5rem] border-[10px] border-stewart-border bg-black p-2 shadow-2xl w-[300px]">
            <iframe
              src="/ion/manager"
              title="Daily Morning View — manager surface"
              className="w-full h-[600px] rounded-[1.8rem] bg-stewart-bg"
            />
          </div>
        </div>

        <div className="max-w-md space-y-4 text-sm text-stewart-muted leading-relaxed">
          <p>
            Four calls, each with one line on why it&apos;s worth opening: a
            hot lead comparing bids, a missed reframe, a clean close worth
            sharing with the team, an email-quote refusal to recover.
          </p>
          <p>
            Tap to hear the moment. Tap again to mark it coached. That&apos;s
            the whole interaction &mdash; the depth lives underneath, in the
            brain and the schema, when a manager wants it.
          </p>
          <p className="text-xs italic">
            This is the live <span className="font-mono">/ion/manager</span>{" "}
            surface embedded right in the page.
          </p>
        </div>
      </div>
    </SectionFrame>
  );
}
