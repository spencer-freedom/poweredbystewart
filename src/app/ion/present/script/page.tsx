import Link from "next/link";

export const dynamic = "force-dynamic";

// Ion's own setting script (v1), shown verbatim with annotations marking
// exactly where the pitch pulls from it. The whole grounding argument in
// one page: "we didn't invent a standard — this is your training material,
// and here's where your reps aren't running it."

// A highlighted line + its margin note.
function Ann({
  children,
  note,
}: {
  children: React.ReactNode;
  note: string;
}) {
  return (
    <div className="my-3 rounded-md border-l-2 border-stewart-accent bg-stewart-accent/10 pl-4 pr-3 py-2">
      <p className="text-stewart-text">{children}</p>
      <p className="mt-1 text-xs text-stewart-accent leading-relaxed">
        ↳ {note}
      </p>
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 mb-3 text-xs uppercase tracking-[0.2em] font-semibold text-stewart-muted">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-stewart-muted leading-relaxed my-2">{children}</p>;
}

export default function IonScriptPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link
        href="/ion/present"
        className="text-sm text-stewart-muted hover:text-stewart-text transition-colors"
      >
        &larr; Back to the walkthrough
      </Link>

      <p className="mt-8 text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent">
        Your own training material
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-stewart-text leading-tight">
        Ion Solar — Setting Script (v1)
      </h1>
      <p className="mt-4 text-base text-stewart-muted leading-relaxed">
        The whole pitch is grounded here. Highlighted lines are where
        it&apos;s pulling from — your own script asks for exactly the moves
        your reps aren&apos;t making.
      </p>

      <div className="mt-10 text-sm">
        <H>Standard Intro</H>
        <P>
          Hi [First Name], this is [Agent] with ION. I&apos;m reaching out
          about the solar form you filled out online. How are you doing today?
        </P>
        <P>
          Great! I have a few questions so we can get started on your solar
          design.
        </P>

        <H>Verify</H>
        <P>Confirm address / home type / property owner. Anyone else on the title? How long at this home?</P>

        <Ann note="The pitch's #1 grounding. Your script says capture the reason AND expand to validate it. Across 332 calls, it was expanded 0 times — captured once, then dropped.">
          <strong className="text-stewart-text">What interested you in solar?</strong>
          {" "}— <em>Expand into that to validate.</em>
        </Ann>

        <P>Utility company is…?</P>

        <Ann note="The bill anchor. Meg, Carter, and Joel all captured it — and all spent it on a credit check instead of using it to build value.">
          <strong className="text-stewart-text">Do you know how much you&apos;re paying on average?</strong>
        </Ann>

        <P>Roof type / how old is it? Have you seen a solar design for this home?</P>

        <Ann note="Carter asked '650.' The script says 670 — a grounded deviation Stewart flags automatically.">
          We have a solar program that saves you money immediately. The only
          requirement is that you have a{" "}
          <strong className="text-stewart-text">credit score above 670.</strong>{" "}
          Is that the case for you?
        </Ann>

        <H>Bill Collection</H>
        <P>
          Last thing before we schedule. The way we design these systems is
          based on how much energy your home uses — we get what we need off
          your utility bill.
        </P>
        <Ann note="Note: the async 'text it to me' hand-off IS the protocol. So Carter following it isn't a script miss — the miss was never building value to carry a qualified lead through it.">
          Do you get those bills in the mail or online?{" "}
          <em>Perfect, would you rather text or email that to me?</em>
        </Ann>

        <H>Button Up</H>
        <P>
          Alright, [Customer], I&apos;ve got you on the schedule for [Date/Time].
          I blocked off an hour so you don&apos;t feel rushed. The only thing we
          ask is that you aren&apos;t driving and can sit down at your computer.
          Is that fair?
        </P>

        <H>Text After Call</H>
        <Ann note="The script tells them to reuse the 'why' even in the follow-up text — one more place the captured reason is supposed to work, and doesn't.">
          Hey [Customer], this is [Agent] with ION Solar. I have you on the
          calendar for [Day/Date/Time] to review{" "}
          <strong className="text-stewart-text">(tieback to interests and/or concerns)</strong>.
          Looking forward to it!
        </Ann>

        <H>Rebuttals (excerpt)</H>
        <Ann note="This is the email-quote-refuser leak: a blanket 'no proposals by email' that can turn a ready buyer into a dead lead. A candidate for a later leak in the deck.">
          <strong className="text-stewart-text">
            &ldquo;Can you send me the proposal before I meet?&rdquo;
          </strong>{" "}
          — Our policy is that we don&apos;t email out the proposals…
        </Ann>
        <P>
          &ldquo;I changed my mind…&rdquo; · &ldquo;I already saw a design…&rdquo;
          · &ldquo;I signed up with someone…&rdquo; · &ldquo;My home doesn&apos;t
          work for solar&rdquo; — each with its own word track.
        </P>

        <p className="mt-12 text-xs text-stewart-muted/70 italic border-t border-stewart-border pt-6">
          Source: Ion training material provided by Spencer, 2026-05-11.
          Reproduced here to show grounding — the pitch invents no standard;
          it measures against yours.
        </p>
      </div>
    </div>
  );
}
