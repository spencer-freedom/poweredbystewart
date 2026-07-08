import Link from "next/link";

export const dynamic = "force-dynamic";

// Ion's own setting script (v1), shown CLEAN — their document, no Stewart
// commentary. The only overlay is the highlight: the lines the pitch pulls
// from glow amber and pulse (like the cup regions), and clicking one jumps
// back to that spot in the presentation. Each carries an id so the
// presentation can deep-link into it too (round trip).

// A pulsing amber, clickable script line — round-trips to the presentation.
function Pull({
  id,
  href,
  children,
}: {
  id: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      id={id}
      href={href}
      className="block my-3 scroll-mt-24 rounded-md border-l-2 border-stewart-warning bg-stewart-warning/15 pl-4 pr-3 py-2 text-stewart-text animate-pulse hover:bg-stewart-warning/25 transition-colors"
    >
      {children}
    </Link>
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
  const back = "/ion/present#proof";
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link
        href="/ion/present"
        className="text-sm text-stewart-muted hover:text-stewart-text transition-colors"
      >
        &larr; Back to the walkthrough
      </Link>

      <h1 className="mt-8 text-3xl sm:text-4xl font-bold text-stewart-text leading-tight">
        Ion Solar — Setting Script (v1)
      </h1>
      <p className="mt-3 text-sm text-stewart-muted">
        Your own training material. Highlighted lines are live — tap one to
        jump back to it in the walkthrough.
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
        <P>
          Confirm address / home type / property owner. Anyone else on the
          title? How long at this home?
        </P>

        <Pull id="s-why" href={back}>
          <strong className="text-stewart-text">What interested you in solar?</strong>{" "}
          — <em>Expand into that to validate.</em>
        </Pull>

        <P>Utility company is…?</P>

        <Pull id="s-bill" href={back}>
          <strong className="text-stewart-text">
            Do you know how much you&apos;re paying on average?
          </strong>
        </Pull>

        <P>Roof type / how old is it? Have you seen a solar design for this home?</P>

        <Pull id="s-credit" href={back}>
          We have a solar program that saves you money immediately. The only
          requirement is that you have a{" "}
          <strong className="text-stewart-text">credit score above 670.</strong>{" "}
          Is that the case for you?
        </Pull>

        <H>Bill Collection</H>
        <P>
          Last thing before we schedule. The way we design these systems is
          based on how much energy your home uses — we get what we need off
          your utility bill.
        </P>
        <P>
          Do you get those bills in the mail or online?{" "}
          <em>Perfect, would you rather text or email that to me?</em>
        </P>

        <H>Button Up</H>
        <P>
          Alright, [Customer], I&apos;ve got you on the schedule for [Date/Time].
          I blocked off an hour so you don&apos;t feel rushed. The only thing we
          ask is that you aren&apos;t driving and can sit down at your computer.
          Is that fair?
        </P>

        <H>Text After Call</H>
        <Pull id="s-tieback" href={back}>
          Hey [Customer], this is [Agent] with ION Solar. I have you on the
          calendar for [Day/Date/Time] to review{" "}
          <strong className="text-stewart-text">
            (tieback to interests and/or concerns)
          </strong>
          . Looking forward to it!
        </Pull>

        <H>Rebuttals (excerpt)</H>
        <P>
          &ldquo;Can you send me the proposal before I meet?&rdquo; ·
          &ldquo;I changed my mind…&rdquo; · &ldquo;I already saw a design…&rdquo;
          · &ldquo;I signed up with someone…&rdquo; · &ldquo;My home
          doesn&apos;t work for solar&rdquo; — each with its own word track.
        </P>

        <p className="mt-12 text-xs text-stewart-muted/70 italic border-t border-stewart-border pt-6">
          Source: Ion training material provided by Spencer, 2026-05-11.
        </p>
      </div>
    </div>
  );
}
