export function StageBBanner() {
  return (
    <div className="inline-flex items-start gap-3 rounded-lg border border-stewart-accent/40 bg-stewart-accent/5 px-4 py-3 max-w-2xl">
      <span className="relative flex h-2 w-2 mt-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-stewart-accent opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-stewart-accent" />
      </span>
      <p className="text-sm text-stewart-text leading-relaxed">
        Stewart is running deeper analysis on your latest calls. Thanks for
        your patience — you&apos;ll love what&apos;s coming.
      </p>
    </div>
  );
}
