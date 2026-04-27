export function ErrorPanel({ error }: { error: string }) {
  const expired =
    /401|403|invalid token|expired/i.test(error) || /token/i.test(error);
  return (
    <div className="max-w-2xl mx-auto mt-12 text-center">
      <h1 className="text-2xl font-bold text-stewart-text mb-3">
        {expired ? "This link has expired" : "We couldn't load your dashboard"}
      </h1>
      <p className="text-stewart-muted mb-6">
        {expired
          ? "Reach out to Spencer for a fresh link — they expire on a rolling basis."
          : "Something went wrong fetching your data. Try again in a moment, or reach out to Spencer."}
      </p>
      <pre className="text-xs text-stewart-muted bg-stewart-card border border-stewart-border rounded p-3 text-left overflow-auto">
        {error}
      </pre>
    </div>
  );
}
