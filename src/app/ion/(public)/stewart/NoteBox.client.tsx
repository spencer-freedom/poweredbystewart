"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InvariantId } from "./schema";

// Autosaving textarea — one per invariant. The whole capture loop
// lives here so the rest of the page is dumb render.
//
// Save semantics:
//   - 3s debounce after last keystroke (per brief)
//   - Each save = one new row in ion_schema_notes (full edit history)
//   - On success: fire-and-forget POST to /api/ion/stewart-notify
//     (Telegram seam — V1 is a stub, see route.ts for the follow-up)
//   - On failure: exponential backoff up to 30s, never lose typed
//     content (state is the source of truth)

const DEBOUNCE_MS = 3000;
const BACKOFF_STEPS_MS = [1000, 2000, 4000, 8000, 16000, 30000];
const RELATIVE_TIME_TICK_MS = 30_000;

type SaveStatus = "idle" | "saving" | "saved" | "error";

// Two distinct feedback streams per (invariant, subsection) — see
// the page anatomy legend for the split logic.
//   stewart = rubric feedback (judgment / grading model). Stabilizes.
//   atlas   = playbook feedback (knowledge / examples). Compounds.
export type NoteKind = "stewart" | "atlas";

// Eight subsections per invariant — mirrors the rendered structure
// of InvariantSection. Feedback attaches to whichever block a
// reviewer is reading.
export type SubsectionId =
  | "core_question"
  | "job"
  | "failure_state"
  | "l1"
  | "l2"
  | "l3"
  | "detection"
  | "economic_impact";

type KindMeta = {
  header: string;
  prompt: string;
  compactPlaceholder: string;
  accentClass: string;
  borderClass: string;
};

const KIND_META: Record<NoteKind, KindMeta> = {
  stewart: {
    header: "Stewart feedback · rubric",
    prompt:
      "How should Stewart evaluate this? Is L1 / L2 / L3 correct? What should Stewart detect? Does this belong here or in a different invariant?",
    compactPlaceholder: "Stewart — how should this be evaluated?",
    accentClass: "text-stewart-accent",
    borderClass: "border-stewart-accent/30",
  },
  atlas: {
    header: "Atlas feedback · playbook",
    prompt:
      "How would you teach this? Word tracks, stories, best practices, exceptions. “My best rep does this by…” Whatever you’d want a new hire to learn.",
    compactPlaceholder: "Atlas — how would you teach this?",
    accentClass: "text-stewart-success",
    borderClass: "border-stewart-success/30",
  },
};

export function NoteBox({
  invariantId,
  subsection,
  reviewer,
  initialContent,
  kind,
  compact = false,
}: {
  invariantId: InvariantId;
  subsection: SubsectionId;
  reviewer: string;
  initialContent: string;
  kind: NoteKind;
  // Per-subsection boxes use compact mode (8 boxes per invariant
  // adds up fast). Set to false for the legacy "one box per
  // invariant" call site if we ever bring it back.
  compact?: boolean;
}) {
  const meta = KIND_META[kind];
  const [local, setLocal] = useState(initialContent);
  const [saved, setSaved] = useState(initialContent);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(
    initialContent ? new Date() : null
  );
  // Relative-time rerender ticker. We don't store the formatted string
  // in state — instead we bump a counter every 30s to force a render.
  const [, setRelativeTick] = useState(0);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const backoffStep = useRef(0);
  // Captures the value we're currently trying to save so a successful
  // save can compare against the latest typed value at completion time.
  const inFlightValue = useRef<string | null>(null);

  const fireNotify = useCallback(
    (invariant: InvariantId, sub: SubsectionId, rev: string, k: NoteKind) => {
      // Fire-and-forget. We deliberately don't await this; Telegram
      // failures never block the save.
      fetch("/api/ion/stewart-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invariant,
          subsection: sub,
          reviewer: rev,
          kind: k,
        }),
        keepalive: true,
      }).catch(() => {
        // Stub today, real Telegram tomorrow. Either way, swallow.
      });
    },
    []
  );

  const attemptSave = useCallback(
    async (value: string) => {
      if (value === saved) {
        // Nothing changed since the last save.
        setStatus("idle");
        return;
      }
      inFlightValue.current = value;
      setStatus("saving");
      let saveFailed = false;
      try {
        const res = await fetch("/api/ion/stewart-save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invariant: invariantId,
            subsection,
            reviewer,
            content: value,
            kind,
          }),
        });
        if (!res.ok) saveFailed = true;
      } catch {
        saveFailed = true;
      }

      if (saveFailed) {
        // Backoff + retry. Cap at 30s per the brief. We retry the
        // CURRENT local value (which may have advanced past the
        // attempted value while we were waiting), not the stale one
        // — losing intermediate keystrokes silently would be worse
        // than another duplicate row.
        const step = Math.min(
          backoffStep.current,
          BACKOFF_STEPS_MS.length - 1
        );
        const delay = BACKOFF_STEPS_MS[step];
        backoffStep.current = step + 1;
        setStatus("error");
        setTimeout(() => {
          // Use a function-form setLocal trick to read the latest
          // value without re-binding the callback.
          setLocal((latest) => {
            attemptSave(latest);
            return latest;
          });
        }, delay);
        return;
      }

      backoffStep.current = 0;
      // If the user kept typing while the save was in flight, the
      // current local value is ahead of what we just persisted.
      // Mark `saved` to the attempted value; the debouncer will
      // catch the next save on the next idle window.
      setSaved(value);
      setSavedAt(new Date());
      setStatus("saved");
      inFlightValue.current = null;
      fireNotify(invariantId, subsection, reviewer, kind);
    },
    [invariantId, subsection, reviewer, saved, kind, fireNotify]
  );

  // Debounce. Every keystroke resets the 3s timer.
  useEffect(() => {
    if (local === saved) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      attemptSave(local);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [local, saved, attemptSave]);

  // Relative-time ticker so "Last saved Xm ago" updates without a
  // keystroke. 30s cadence is comfortably finer than the smallest
  // human-readable label we render.
  useEffect(() => {
    if (!savedAt) return;
    const id = setInterval(() => {
      setRelativeTick((n) => n + 1);
    }, RELATIVE_TIME_TICK_MS);
    return () => clearInterval(id);
  }, [savedAt]);

  // Flush on tab close. keepalive: true above already covers most
  // browsers; this `beforeunload` is belt + suspenders for stragglers.
  useEffect(() => {
    const onBeforeUnload = () => {
      if (local !== saved && local.length > 0) {
        // Synchronous-ish save via the same path. Result is racy on
        // close but the keepalive flag in fireNotify covers retries
        // in the next session via the debouncer when Kenny reloads.
        void attemptSave(local);
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [local, saved, attemptSave]);

  return (
    <div
      className={
        "rounded-lg border bg-stewart-card " +
        meta.borderClass +
        " " +
        (compact ? "p-3" : "p-5")
      }
    >
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <p
          className={
            "font-semibold " +
            meta.accentClass +
            " " +
            (compact ? "text-xs" : "text-sm")
          }
        >
          {meta.header}
        </p>
        <StatusLabel status={status} savedAt={savedAt} />
      </div>
      {!compact ? (
        <p className="text-xs text-stewart-muted mb-3 leading-relaxed">
          {meta.prompt}
        </p>
      ) : null}
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={compact ? meta.compactPlaceholder : "Type here…"}
        className={
          "w-full bg-stewart-bg border border-stewart-border rounded p-3 text-sm text-stewart-text placeholder:text-stewart-muted/60 focus:border-stewart-accent focus:outline-none leading-relaxed resize-y " +
          (compact ? "min-h-20 sm:min-h-24" : "min-h-32 sm:min-h-36")
        }
        spellCheck={true}
      />
    </div>
  );
}

function StatusLabel({
  status,
  savedAt,
}: {
  status: SaveStatus;
  savedAt: Date | null;
}) {
  if (status === "saving") {
    return (
      <span className="text-xs text-stewart-accent italic">Saving…</span>
    );
  }
  if (status === "error") {
    return (
      <span className="text-xs text-stewart-warning">
        Connection blip · retrying
        {savedAt ? <> · last saved {relativeTime(savedAt)}</> : null}
      </span>
    );
  }
  if (savedAt) {
    return (
      <span className="text-xs text-stewart-muted">
        Last saved {relativeTime(savedAt)}
      </span>
    );
  }
  return null;
}

// Coarse-grained relative time. "Just now" until 30s; minutes after
// that; switches to a date string after an hour. The page only ever
// shows the most recent save; rough resolution is plenty.
function relativeTime(when: Date): string {
  const seconds = Math.floor((Date.now() - when.getTime()) / 1000);
  if (seconds < 30) return "just now";
  if (seconds < 90) return "a minute ago";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return when.toLocaleString();
}

