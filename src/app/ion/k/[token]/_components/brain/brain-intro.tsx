"use client";

// Cinematic intro overlay. Plays once per session (sessionStorage flag).
// Timeline (locked in the visual encoding brief):
//   t=0.0s  Black canvas overlay, ether drifts. Camera at z=900.
//   t=0.5s  "This is Stewart's brain." fades in.
//   t=2.0s  Subtitle fades in below.
//   t=3.0s  Camera tween 900 → (200,140,200) ease-in-out over 4s.
//   t=5.5s  Text fades out.
//   t=7.0s  Overlay dismisses, auto-rotate begins, flag saved.
//
// If the flag is already set on mount, this component renders nothing
// and the parent's instant camera-set is what runs.

import { useEffect, useState } from "react";

const STORAGE_KEY = "stewart_brain_intro_seen";

type Stage = "hidden" | "blackout" | "title" | "subtitle" | "zoom" | "fade-out" | "done";

export function BrainIntro({
  onCameraStart,
  onCameraZoom,
  onComplete,
}: {
  // Called on mount when intro will run — parent should set the camera
  // far out (z=900) so the brain materializes during the zoom.
  onCameraStart: () => void;
  // Called at t=3s to start the camera tween toward the resting pose.
  onCameraZoom: () => void;
  // Called at t=7s when the intro is over.
  onComplete: () => void;
}) {
  const [stage, setStage] = useState<Stage>("hidden");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) {
      setStage("done");
      return;
    }
    onCameraStart();
    setStage("blackout");
    const t1 = setTimeout(() => setStage("title"), 500);
    const t2 = setTimeout(() => setStage("subtitle"), 2000);
    const t3 = setTimeout(() => {
      setStage("zoom");
      onCameraZoom();
    }, 3000);
    const t4 = setTimeout(() => setStage("fade-out"), 5500);
    const t5 = setTimeout(() => {
      setStage("done");
      sessionStorage.setItem(STORAGE_KEY, "1");
      onComplete();
    }, 7000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
    // We deliberately ignore the callback identities — they should be
    // captured at mount, not re-bound on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (stage === "hidden" || stage === "done") return null;

  // Backdrop opacity dims as the camera enters the cloud at zoom stage,
  // and fully clears at fade-out.
  const backdropOpacity =
    stage === "blackout" || stage === "title" || stage === "subtitle"
      ? 0.92
      : stage === "zoom"
      ? 0.55
      : 0.0; // fade-out

  const titleOpacity =
    stage === "title" || stage === "subtitle" || stage === "zoom" ? 1 : 0;
  const subtitleOpacity =
    stage === "subtitle" || stage === "zoom" ? 1 : 0;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{
        background: `radial-gradient(circle at center, rgba(2,6,23,${backdropOpacity * 0.6}) 0%, rgba(2,6,23,${backdropOpacity}) 70%)`,
        transition: "background 1500ms ease-out",
      }}
    >
      <div className="text-center px-6">
        <div
          className="font-light tracking-wide transition-opacity duration-1000"
          style={{
            color: "#E2E8F0",
            fontSize: 42,
            fontWeight: 200,
            letterSpacing: "0.02em",
            textShadow: "0 2px 16px rgba(94,234,212,0.18)",
            opacity: titleOpacity,
          }}
        >
          This is Stewart&apos;s brain.
        </div>
        <div
          className="mt-4 transition-opacity duration-1000"
          style={{
            color: "#94A3B8",
            fontSize: 16,
            fontWeight: 300,
            opacity: subtitleOpacity,
          }}
        >
          Each call. Each objection. Each solution. What worked, what didn&apos;t.
        </div>
      </div>
    </div>
  );
}

// Small helper for parents that want to know whether to do the instant
// camera-set or the cinematic. Returns true when the intro will play.
export function shouldPlayIntro(): boolean {
  if (typeof window === "undefined") return false;
  return !sessionStorage.getItem(STORAGE_KEY);
}
