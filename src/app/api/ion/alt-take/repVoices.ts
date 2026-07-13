// Rep → ElevenLabs voice_id map for the "could've said" voice-mirror feature.
// Server-only. Clones are created out-of-band (see spenceros extract/clone
// pipeline) and their voice_id pasted here. Keep this list to reps we have
// explicit OK to mirror — never prospects.
//
// To add a rep: build a clean rep-only sample, create an ElevenLabs Instant
// Voice Clone, then add `"<Rep>": "<voice_id>"` below.

export const REP_VOICES: Record<string, string> = {
  Joel: "uS9lOjokAtoEe0st5BC6",
  Carter: "baJ3vjxJXWB99QnXAuWe",
  Meg: "0upEJo7mzvghqhp0W5NV",
};

export function voiceIdForRep(rep: string): string | null {
  return REP_VOICES[rep] ?? null;
}
