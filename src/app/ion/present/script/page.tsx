import Link from "next/link";
import { HashHighlight } from "../_components/HashHighlight.client";
import { SCRIPT_PARAS, type ScriptPara, type ScriptRun } from "./scriptData";

export const dynamic = "force-dynamic";

// Ion's own v2 Master Paid Lead Setting Script, verbatim, rendered as a
// white document (their doc — red coaching notes preserved) inside the dark
// pitch page. The lines the pitch pulls from carry round-trip labels and
// light up when navigated to. Goal: they recognize it as THEIR script.

const P_ = "/ion/present";

type Chip = { label: string; href: string };

// Anchor lines the pitch pulls from — matched by a substring of the line.
// NOTE: v1 has no "why solar" question, so the s-why anchor is omitted here
// (pending Spencer's decision on how to frame that gap).
const ANCHORS: { match: string; id: string; chips: Chip[] }[] = [
  {
    match: "spending on average",
    id: "s-bill",
    chips: [
      { label: "Meg", href: `${P_}#clip-meg-0` },
      { label: "Carter 2", href: `${P_}#clip-carter-1` },
    ],
  },
  {
    match: "bills in the mail or online",
    id: "s-collect",
    chips: [{ label: "Carter 3", href: `${P_}#clip-carter-2` }],
  },
];

function Runs({ runs }: { runs: ScriptRun[] }) {
  return (
    <>
      {runs.map((r, i) => {
        const cls =
          (r.red ? "text-red-600 " : "") + (r.bold ? "font-semibold" : "");
        return cls.trim() ? (
          <span key={i} className={cls.trim()}>
            {r.t}
          </span>
        ) : (
          <span key={i}>{r.t}</span>
        );
      })}
    </>
  );
}

function anchorFor(text: string) {
  return ANCHORS.find((a) => text.includes(a.match));
}

function Para({ para }: { para: ScriptPara }) {
  const text = para.runs.map((r) => r.t).join("");

  if (para.head) {
    return (
      <h3 className="mt-9 mb-3 border-t border-neutral-300 pt-6 text-sm font-bold uppercase tracking-[0.15em] text-neutral-800">
        <Runs runs={para.runs} />
      </h3>
    );
  }

  const anchor = anchorFor(text);
  if (anchor) {
    return (
      <div
        id={anchor.id}
        className="hl-target -mx-2 my-2 flex items-baseline gap-4 rounded px-2 py-1"
      >
        <p className="flex-1 leading-relaxed text-neutral-800">
          <Runs runs={para.runs} />
        </p>
        <div className="flex shrink-0 flex-wrap justify-end gap-x-3 gap-y-1">
          {anchor.chips.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="whitespace-nowrap text-[10px] font-mono uppercase tracking-wider text-blue-600 hover:text-blue-800"
            >
              {c.label}&nbsp;&rarr;
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <p className="my-2 leading-relaxed text-neutral-800">
      <Runs runs={para.runs} />
    </p>
  );
}

export default function IonScriptPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <HashHighlight />

      <div className="flex items-center justify-between gap-4">
        <Link
          href={P_}
          className="text-sm text-stewart-muted hover:text-stewart-text transition-colors"
        >
          &larr; Back to the walkthrough
        </Link>
        <span className="text-xs text-stewart-muted/70">
          Ion&apos;s own training material — tagged lines round-trip to the
          clips
        </span>
      </div>

      {/* The document itself — white sheet on the dark theme */}
      <div className="mt-6 rounded-lg bg-white text-neutral-800 shadow-2xl px-6 py-8 sm:px-10 sm:py-12 text-sm">
        <p className="mb-6 text-center text-lg font-bold text-neutral-900">
          ION Solar — Master Paid Lead Setting Script
        </p>
        {SCRIPT_PARAS.map((para, i) => (
          <Para key={i} para={para} />
        ))}
      </div>
    </div>
  );
}
