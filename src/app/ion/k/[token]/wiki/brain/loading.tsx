import { StewartCallout } from "../../_components/stewart-callout";

export default function BrainLoading() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-stewart-text">
          Stewart&apos;s Brain
        </h1>
      </div>
      <StewartCallout kind="learning">
        every call, every objection, every solution. Pulling 1,500+ nodes
        from your floor&apos;s call data — usually 5-15 seconds on a cold
        cache.
      </StewartCallout>
      <div className="rounded-lg border border-stewart-border bg-stewart-card h-[480px] flex items-center justify-center">
        <div className="text-stewart-muted text-sm font-mono animate-pulse">
          loading graph…
        </div>
      </div>
    </div>
  );
}
