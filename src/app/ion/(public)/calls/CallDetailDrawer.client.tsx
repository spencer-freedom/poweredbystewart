"use client";

import { useEffect } from "react";
import type { CallSummary } from "./types";
import { FullCallDetail } from "../_components/FullCallDetail.client";

// Side-sliding drawer used by the /ion/calls browse list. V2.0.2: the
// per-call rendering moved into the shared <FullCallDetail/> component
// so the brain's PlanetDetail can render the same depth.

export function CallDetailDrawer({
  callId,
  summary,
  onClose,
}: {
  callId: string;
  summary: CallSummary | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-stretch justify-end"
      onClick={onClose}
    >
      <aside
        className="bg-stewart-bg border-l border-stewart-border w-full sm:max-w-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-stewart-card border-b border-stewart-border px-5 py-4 flex items-center justify-between z-10">
          <span className="text-xs uppercase tracking-wider font-mono text-stewart-muted">
            Call detail
          </span>
          <button
            onClick={onClose}
            className="text-stewart-muted hover:text-stewart-text text-sm"
          >
            Close ✕
          </button>
        </header>
        <div className="px-5 py-6">
          <FullCallDetail
            callId={callId}
            summary={summary ?? undefined}
            showCrossLink={false}
          />
        </div>
      </aside>
    </div>
  );
}
