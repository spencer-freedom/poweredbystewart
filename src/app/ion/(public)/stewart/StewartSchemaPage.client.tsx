"use client";

import type { InvariantId } from "./schema";
import { INVARIANTS } from "./schema";
import { InvariantSection } from "./InvariantSection.client";
import type { SubsectionId } from "./NoteBox.client";

export type NotesByKind = { stewart: string; atlas: string };
export type NotesByKindBySubsection = Record<SubsectionId, NotesByKind>;

// Top-level client wrapper. Mostly a render loop — most state lives
// inside each NoteBox. Keeps the page.tsx server component thin.

const EMPTY_SUBSECTION_NOTES: NotesByKindBySubsection = {
  core_question: { stewart: "", atlas: "" },
  job: { stewart: "", atlas: "" },
  failure_state: { stewart: "", atlas: "" },
  l1: { stewart: "", atlas: "" },
  l2: { stewart: "", atlas: "" },
  l3: { stewart: "", atlas: "" },
  detection: { stewart: "", atlas: "" },
  economic_impact: { stewart: "", atlas: "" },
};

export function StewartSchemaPage({
  reviewer,
  initialNotes,
}: {
  reviewer: string;
  initialNotes: Record<InvariantId, NotesByKindBySubsection>;
}) {
  return (
    <div className="space-y-12 sm:space-y-14">
      {INVARIANTS.map((inv) => (
        <InvariantSection
          key={inv.id}
          invariant={inv}
          reviewer={reviewer}
          initialNotes={initialNotes[inv.id] || EMPTY_SUBSECTION_NOTES}
        />
      ))}
    </div>
  );
}
