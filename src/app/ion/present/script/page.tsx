import Link from "next/link";
import { HashHighlight } from "../_components/HashHighlight.client";

export const dynamic = "force-dynamic";

// Ion's own setting script (v1), shown CLEAN — their document, no Stewart
// commentary. The lines the pitch pulls from carry small back-labels (Meg /
// Joel / Carter 1-3); clicking one round-trips to that exact clip moment in
// the presentation. When you arrive here from the presentation, only the
// line you clicked to lights up + pulses (via :target / .hl-target).

type Chip = { label: string; href: string };

// A script line the pitch pulls from. `id` is the deep-link target; `chips`
// are the round-trip links back to specific clip moments.
function Pull({
  id,
  chips,
  children,
}: {
  id: string;
  chips: Chip[];
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="hl-target my-3 -mx-3 px-3 py-2">
      <p className="text-stewart-text leading-relaxed">{children}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {chips.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="text-[11px] uppercase tracking-wider font-mono text-stewart-accent border border-stewart-accent/40 rounded px-2 py-0.5 hover:bg-stewart-accent/10 transition-colors"
          >
            {c.label} &rarr;
          </Link>
        ))}
      </div>
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

const P_ = "/ion/present";

export default function IonScriptPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <HashHighlight />
      <Link
        href={P_}
        className="text-sm text-stewart-muted hover:text-stewart-text transition-colors"
      >
        &larr; Back to the walkthrough
      </Link>

      <h1 className="mt-8 text-3xl sm:text-4xl font-bold text-stewart-text leading-tight">
        Ion Solar — Setting Script (v1)
      </h1>
      <p className="mt-3 text-sm text-stewart-muted">
        Your own training material. The tagged lines round-trip to the clips
        in the walkthrough.
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

        <Pull
          id="s-why"
          chips={[
            { label: "Joel", href: `${P_}#clip-joel-0` },
            { label: "Carter 1", href: `${P_}#clip-carter-0` },
          ]}
        >
          <strong className="text-stewart-text">What interested you in solar?</strong>{" "}
          — <em>Expand into that to validate.</em>
        </Pull>

        <P>Utility company is…?</P>

        <Pull
          id="s-bill"
          chips={[
            { label: "Meg", href: `${P_}#clip-meg-0` },
            { label: "Carter 2", href: `${P_}#clip-carter-1` },
          ]}
        >
          <strong className="text-stewart-text">
            Do you know how much you&apos;re paying on average?
          </strong>
        </Pull>

        <P>Roof type / how old is it? Have you seen a solar design for this home?</P>

        <Pull id="s-credit" chips={[{ label: "Carter 3", href: `${P_}#clip-carter-2` }]}>
          We have a solar program that saves you money immediately. The only
          requirement is that you have a{" "}
          <strong className="text-stewart-text">credit score above 670.</strong>{" "}
          Is that the case for you?
        </Pull>

        <H>Bill Collection</H>
        <P>
          Last thing before we schedule. The way we design these systems is
          based on how much energy your home uses — we get what we need off
          your utility bill. Do you get those bills in the mail or online?
          <em> Perfect, would you rather text or email that to me?</em>
        </P>

        <H>Button Up</H>
        <P>
          Alright, [Customer], I&apos;ve got you on the schedule for [Date/Time].
          I blocked off an hour so you don&apos;t feel rushed. The only thing we
          ask is that you aren&apos;t driving and can sit down at your computer.
          Is that fair?
        </P>

        <H>Text After Call</H>
        <P>
          Hey [Customer], this is [Agent] with ION Solar. I have you on the
          calendar for [Day/Date/Time] to review (tieback to interests and/or
          concerns). Looking forward to it!
        </P>

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
