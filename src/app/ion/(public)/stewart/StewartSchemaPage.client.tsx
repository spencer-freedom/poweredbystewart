"use client";

import type { InvariantId } from "./schema";
import { INVARIANTS } from "./schema";
import { InvariantSection } from "./InvariantSection.client";

// Top-level client wrapper. Mostly a render loop — most state lives
// inside each NoteBox. Keeps the page.tsx server component thin.

export function StewartSchemaPage({
  reviewer,
  initialNotes,
}: {
  reviewer: string;
  initialNotes: Record<InvariantId, string>;
}) {
  return (
    <div className="space-y-12 sm:space-y-14">
      {INVARIANTS.map((inv) => (
        <InvariantSection
          key={inv.id}
          invariant={inv}
          reviewer={reviewer}
          initialContent={initialNotes[inv.id] || ""}
        />
      ))}
    </div>
  );
}
