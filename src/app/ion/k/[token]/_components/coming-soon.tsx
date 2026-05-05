// Stub page for v2 surfaces that haven't lit up yet (depend on backend
// endpoints not yet shipped). Visible at the route URL but unlinked from
// any nav. When the dependent endpoint lands, replace ComingSoon with
// the real surface — same route, no URL changes needed.

export function ComingSoon({
  surface,
  blockedOn,
}: {
  surface: string;
  blockedOn: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
        {surface}
      </p>
      <h1 className="text-2xl font-bold text-stewart-text mb-3">
        Stewart&apos;s still working on this part.
      </h1>
      <p className="text-stewart-muted leading-relaxed">
        This surface is part of the v2 build. Lights up when{" "}
        <code className="text-stewart-text">{blockedOn}</code> ships.
      </p>
    </div>
  );
}
