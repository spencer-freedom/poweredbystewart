import { promises as fs } from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

// /ion/narrator — audition designed voices for Stewart's narration. Every
// candidate reads the same line of the morning brief. Pick one; the
// generated_voice_id gets saved as a permanent voice and set as
// ELEVENLABS_NARRATOR_VOICE_ID. Designed voices, not stock — nobody's
// heard these before, and none of them is Spencer.

type Candidate = { id: string; family: string; description: string; generated_voice_id: string; file: string };

export default async function NarratorAuditionPage() {
  const raw = await fs.readFile(path.join(process.cwd(), "public", "ion", "narrator-candidates", "manifest.json"), "utf-8");
  const { line, candidates } = JSON.parse(raw) as { line: string; candidates: Candidate[] };
  const families = [...new Set(candidates.map((c) => c.family))];
  return (
    <main className="min-h-screen bg-stewart-bg text-stewart-text px-4 sm:px-6 py-10 max-w-3xl mx-auto">
      <p className="text-xs uppercase tracking-wider text-stewart-muted">Stewart&apos;s voice</p>
      <h1 className="text-2xl font-bold mt-1">Pick the narrator.</h1>
      <p className="mt-2 text-sm text-stewart-muted leading-relaxed">
        Twelve designed voices — not stock, not cloned — each reading the same line of the brief. Tell Spencer&apos;s
        session the id (A1 … D3) and it becomes Stewart&apos;s voice on every brief from then on.
      </p>
      <blockquote className="mt-4 rounded-lg border border-stewart-border bg-stewart-card p-4 text-sm text-stewart-text leading-relaxed italic">
        &ldquo;{line}&rdquo;
      </blockquote>

      {families.map((fam) => {
        const group = candidates.filter((c) => c.family === fam);
        return (
          <section key={fam} className="mt-8">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stewart-accent">Family {fam}</p>
            <p className="mt-1 text-sm text-stewart-muted leading-relaxed">{group[0]?.description}</p>
            <ul className="mt-3 grid sm:grid-cols-3 gap-3">
              {group.map((c) => (
                <li key={c.id} className="rounded-lg border border-stewart-border bg-stewart-card p-3">
                  <p className="font-mono text-lg font-bold text-stewart-text">{c.id}</p>
                  <audio controls preload="none" src={c.file} className="mt-2 w-full h-9" />
                  <p className="mt-1 text-[10px] font-mono text-stewart-muted truncate">{c.generated_voice_id}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
