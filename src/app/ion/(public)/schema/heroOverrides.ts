import { promises as fs } from "node:fs";
import path from "node:path";
import type { HeroOverridesFile } from "./types";

// Track 2 hero overrides. Strategy Claude lands
// public/ion/schema-hero-overrides.json with hand-written hero copy
// keyed by section path. When the file exists, the schema page reads
// it server-side and swaps the matching fields into auto-template
// cards. When absent (or malformed), the page falls back to pure
// auto-template rendering — no errors, no blank cards.
//
// Contract with Strategy Claude (locked):
//   - Path: public/ion/schema-hero-overrides.json
//   - Shape: Record<section_path, HeroOverride>
//   - Fields per entry: headline, what_this_is, why_it_matters,
//     what_good_sounds_like: { quote, attribution }, coaching_focus,
//     bombshell. All fields optional; missing fields fall back to
//     the auto-template defaults.
//   - A minimal entry of just `{ bombshell: true }` lights the
//     ribbon without overriding any copy.

export async function loadHeroOverrides(): Promise<HeroOverridesFile> {
  const filePath = path.join(
    process.cwd(),
    "public",
    "ion",
    "schema-hero-overrides.json"
  );
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf-8");
  } catch (err: unknown) {
    // Missing file is the expected default state until Track 2 ships.
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return {};
    console.warn("[schema] hero overrides read failed:", err);
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      console.warn("[schema] hero overrides not a JSON object — ignoring");
      return {};
    }
    return parsed as HeroOverridesFile;
  } catch (err) {
    console.warn("[schema] hero overrides JSON parse failed:", err);
    return {};
  }
}
