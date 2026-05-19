import Link from "next/link";

export const dynamic = "force-dynamic";

export default function WhatsNextPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
          Scope of work
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-stewart-text leading-tight">
          What we build, what Ion provides, and how the first 90 days look
        </h1>
      </div>

      <div className="rounded-lg border border-dashed border-stewart-warning/50 bg-stewart-warning/5 p-6">
        <p className="text-xs uppercase tracking-wider font-semibold text-stewart-warning mb-2">
          TODO · content from Strategy Claude
        </p>
        <p className="text-sm text-stewart-muted leading-relaxed">
          Scope of Work content lives in content/ion/whats-next-scope.mdx
          (or equivalent). Strategy Claude fills this in subsequent commits.
          Expected shape: build commitments, Ion commitments, 90-day
          milestone table, and a closing CTA back to a contact path.
        </p>
      </div>

      <div>
        <Link
          href="/ion"
          className="text-sm text-stewart-muted hover:text-stewart-text transition-colors"
        >
          ← Back to the demo
        </Link>
      </div>
    </div>
  );
}
