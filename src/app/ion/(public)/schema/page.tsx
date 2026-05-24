import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { SchemaBrowser } from "./SchemaBrowser.client";
import { loadHeroOverrides } from "./heroOverrides";
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
  const [payload, overrides] = await Promise.all([
    loadPayload(),
    loadHeroOverrides(),
  ]);
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
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-stewart-text leading-tight">
          Ion Solar &mdash; the schema Stewart reads every call against
        </h1>
        <p className="mt-4 text-base text-stewart-muted leading-relaxed max-w-3xl">
          Every section Stewart reads, in one canvas. Live cards are the
          coaching the floor gets today. Scaffolded cards are the
          sections we&apos;ve mapped — the embedded build converts them
          into live ones.
        </p>
      </header>

      <SchemaBrowser payload={payload} overrides={overrides} />
    </div>
  );
}
