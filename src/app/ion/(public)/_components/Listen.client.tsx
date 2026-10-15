"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Two small reporters for the visits log, both fire-and-forget beacons:
//   - TrackedAudio: an <audio> that reports the seconds it actually played
//     (not the clip's length), flushed on pause, end, tab hidden, or leaving.
//   - Presence: while the page is open and visible, a ping a minute, plus the
//     remainder on leaving, so time on the page is measured, not inferred.
// Nothing here identifies anyone beyond what the request already carries.

function send(body: Record<string, unknown>) {
  try {
    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
    if (!navigator.sendBeacon("/api/ion/listen", blob)) void fetch("/api/ion/listen", { method: "POST", body: blob, keepalive: true });
  } catch { /* a lost beacon is not worth a retry */ }
}

export const TrackedAudio = forwardRef<HTMLAudioElement, React.AudioHTMLAttributes<HTMLAudioElement>>(function TrackedAudio(props, ref) {
  const inner = useRef<HTMLAudioElement>(null);
  useImperativeHandle(ref, () => inner.current as HTMLAudioElement);
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    let last: number | null = null;
    let played = 0;
    const src = () => (el.currentSrc || el.src || "").replace(/^https?:\/\/[^/]+/, "");
    const flush = () => { if (played >= 1) { send({ kind: "listen", src: src(), seconds: Math.round(played), page: location.pathname }); played = 0; } last = null; };
    const onTime = () => {
      if (el.paused) return;
      const t = el.currentTime;
      if (last !== null && t > last && t - last < 2) played += t - last;
      last = t;
    };
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("pause", flush);
    el.addEventListener("ended", flush);
    el.addEventListener("seeking", () => { last = null; });
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("pause", flush);
      el.removeEventListener("ended", flush);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, []);
  return <audio ref={inner} {...props} />;
});

export function Presence() {
  useEffect(() => {
    let since = Date.now();
    const tick = () => {
      if (document.visibilityState !== "visible") { since = Date.now(); return; }
      const s = Math.round((Date.now() - since) / 1000);
      since = Date.now();
      if (s >= 5) send({ kind: "ping", seconds: Math.min(s, 120), page: location.pathname });
    };
    const id = setInterval(tick, 60000);
    const onVis = () => { if (document.visibilityState === "hidden") tick(); else since = Date.now(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", tick);
    return () => { tick(); clearInterval(id); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("pagehide", tick); };
  }, []);
  return null;
}
