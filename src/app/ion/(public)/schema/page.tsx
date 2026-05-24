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
          The Ion Solar Schema
        </h1>
        <p className="mt-4 text-base text-stewart-text leading-relaxed">
          The operational intelligence framework Stewart uses to evaluate
          every call against Ion&rsquo;s coaching standards, sales
          philosophy, and processes.
        </p>
      </header>

      <SchemaBrowser payload={payload} overrides={overrides} />
    </div>
  );
}
