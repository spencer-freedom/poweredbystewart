import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { SchemaBrowser } from "./SchemaBrowser.client";
import type { SchemaPayload } from "./types";

export const dynamic = "force-dynamic";

async function loadPayload(): Promise<SchemaPayload> {
  const filePath = path.join(
    process.cwd(),
    "public",
    "ion",
    "schema-payload.json"
  );
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as SchemaPayload;
}

export default async function IonSchemaPage() {
  const payload = await loadPayload();
  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent">
            Your floor&apos;s textbook
          </p>
          <Link
            href="/ion"
            className="text-sm text-stewart-muted hover:text-stewart-text transition-colors"
          >
            &larr; Back to the demo
          </Link>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          Ion Solar &mdash; the schema Stewart reads every call against
        </h1>
        <p className="mt-4 text-lg text-stewart-muted leading-relaxed max-w-3xl">
          <span className="text-stewart-text font-mono">
            {payload.stats.total_lines.toLocaleString()}
          </span>{" "}
          lines of schema.{" "}
          <span className="text-stewart-text font-mono">
            {payload.stats.sections_lit}
          </span>{" "}
          sections actively lit by Stewart&apos;s reads.{" "}
          <span className="text-stewart-text font-mono">
            {payload.stats.tbds}
          </span>{" "}
          TBDs Spencer + Kenny work through together during embedded
          build.{" "}
          <span className="text-stewart-text font-mono">
            {payload.stats.resolved}
          </span>{" "}
          RESOLVED already.{" "}
          <span className="text-stewart-text font-mono">
            {payload.stats.proposed_pending}
          </span>{" "}
          new categories pending Kenny&apos;s approval.
        </p>
      </header>

      <SchemaBrowser payload={payload} />
    </div>
  );
}
