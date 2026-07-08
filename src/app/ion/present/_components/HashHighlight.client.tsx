"use client";

import { useEffect } from "react";

// Round-trip highlighter. Next's client-side navigation doesn't re-evaluate
// the CSS :target pseudo-class (and often doesn't scroll to the hash), so
// this reads the URL hash, adds `.hl-active` to the matching .hl-target
// element, and scrolls it into view. Runs on mount (covers cross-page
// round trips, since the page remounts) and on hashchange.
export function HashHighlight() {
  useEffect(() => {
    const apply = () => {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      document
        .querySelectorAll(".hl-active")
        .forEach((el) => el.classList.remove("hl-active"));
      if (!id) return;
      const el = document.getElementById(id);
      if (el) {
        el.classList.add("hl-active");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    // small delay so the DOM + hash are settled after a client-side nav
    const t = window.setTimeout(apply, 80);
    window.addEventListener("hashchange", apply);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", apply);
    };
  }, []);
  return null;
}
