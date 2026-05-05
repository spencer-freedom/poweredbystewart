// Stub page for v2 surfaces that haven't lit up yet (depend on backend
// endpoints not yet shipped). Visible at the route URL but unlinked from
// any nav. When the dependent endpoint lands, replace ComingSoon with
// the real surface — same route, no URL changes needed.

import { StewartCallout } from "./stewart-callout";

export function ComingSoon({
  surface,
  blockedOn,
}: {
  surface: string;
  blockedOn: string;
}) {
  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-xs uppercase tracking-wider text-stewart-muted">
        {surface}
      </p>
      <StewartCallout kind="wip">
        This surface is part of the v2 build. Lights up when{" "}
        <code className="text-stewart-text">{blockedOn}</code> ships.
      </StewartCallout>
    </div>
  );
}
