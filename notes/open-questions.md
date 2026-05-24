# Open Questions — `ion-scroll-demo` branch

Questions surfaced during scaffolding. Spencer or Strategy Claude can
resolve and the scaffolding Claude (or follow-on pass) will adjust.

## Brain V2.1 deferrals (2026-05-23)

V2 brain shipped per `BRIEF_stream_b_brain_v2.md` + the 2026-05-24
correction (quantity-per-section absorption; uniform-radius + jitter).
Per the brief's SCOPE DISCIPLINE block, the one deferred item is
flagged here BEFORE the commit:

**1. Card-explosion animation choreography is deferred to V2.1.**

The brief specified that clicking a node (core / tile / planet / moon)
animates cards OUT from the clicked node toward a margin space, with
thin connecting lines from each card back to the clicked source. V2
ships the same data model and the same card content (CoreMeta /
TileDetail / PlanetDetail) — but in a side-docked panel rather than
node-anchored animated cards.

Why deferred:
- The animation choreography requires projecting the clicked node's
  world position into screen coordinates per frame (R3F provides this
  via `useThree(state => state.camera).project(...)`, but the panel
  cards live in DOM space — bridging the two coordinate systems for
  animated connector lines is non-trivial)
- Card stack layout adjacent to the brain canvas would need a
  measured viewport bridge so the cards don't overlap the canvas while
  the canvas shrinks to make room — another coordinate sync layer
- Framer-motion can carry the FLIP-style enter animation, but the
  connecting lines must be redrawn each frame as both endpoints
  potentially move (camera rotation moves the source; layout reflow
  moves the target)
- Honest call: this is ~6–10 hours of careful work to ship well; the
  rest of V2 was the priority for this session

Everything else from the V2 brief shipped:
- Crystal core (MeshPhysicalMaterial translucent sphere + lat/long
  grid + 108 tiles, 101 active + 7 inactive, colored by domain,
  saturation_boost driving emissive intensity)
- 332 call planets at uniform radius + jitter, deterministic per
  call_id, sized by planet_size, tinted by outcome
- 2,405 moons orbiting their planets at varying radii and phases,
  colored by codex_reference domain
- Grounding vector from each planet to (0,0,0), low-opacity baseline,
  brightens on hover
- Gray-matter override: 3 presumptive exemplars stuck near their
  exemplifying tiles (r_gray_matter = 52), gold halo with pulse,
  always-visible EXEMPLAR label floating above the planet
- Absorption: opacity = 1 - absorption_factor; size *= 1 - 0.5 *
  absorption_factor; planets with absorption_factor >= 0.95 don't
  render
- Stat strip with payload counts (332 / 101 / 2405 / 3 / 8)
- Legend with 13 domain swatches + hover-to-highlight (tiles + moons
  of that domain brighten in unison)
- Hover tooltips on planets (call_id / rep / outcome / duration) and
  moons (ts / classification / quote excerpt)
- Click → side detail panel with appropriate card content per kind
  (core meta, tile detail, planet folder, moon highlights matching
  cherry-pick in its parent planet's card)
- Idle slow scene rotation; OrbitControls for drag-orbit + scroll-zoom
- Mobile: friendly "open on desktop for full visual" message; canvas
  hidden below sm breakpoint
- Both routes wired (/ion/brain public + /ion/k/[token]/wiki/brain
  with role gate preserved)

Verification:
- npx tsc --noEmit clean
- npx next build clean
- /ion/brain 200, payload streams (~1.3MB raw, gzip ~250KB), no
  runtime errors during dev compile
- /ion/k/[token]/wiki/brain 200 with DEV_BYPASS=1 (role gate blocks
  without it)

---

## Brain V1.5 deferrals (2026-05-23)

V1 brain renderer ships in commits ahead of this note. Per the
brain-renderer brief, these were explicitly cut from V1 to keep the
session focused on the three-layer visual + real stats:

1. **Cinematic intro animation (~7s camera move).** V1 has a single
   pulled-back camera position on engine-ready + auto-rotate. The
   animated establishing shot the brief described would need a custom
   tween + scene-ready signal we didn't have time to wire cleanly.
2. **Search box (top-right, filters by codex section / call_id / rep).**
   V1 has no search. The data is in the payload; UI was scope risk.
3. **Click-to-drawer sidebar with full call list.** V1 click pins the
   existing hover card so the user can read it without holding the
   mouse still. The sidebar drawer with all calls referencing a core
   section is the natural V1.5 expansion.
4. **Cluster floating labels.** Dense core nodes (>20 cherry-picks)
   don't get labeled tags floating above them. Hover detail card carries
   the same info on demand.
5. **Edge rendering on hover.** "Multi-touch" / "answered_by" edges
   exist in the source data (cherrypicks.json on each call) but aren't
   loaded or rendered. V1 ships zero edges — proximity does the work,
   per the brief's "edge de-emphasis" guidance.

Brief also assumed R3F + drei as the stack; existing brain code uses
`react-force-graph-3d`. V1 stayed on react-force-graph-3d to avoid a
risky stack migration in one session. R3F+drei migration is its own
follow-up brief if Spencer wants the custom-scene flexibility.

Stats render real numbers from the 101-file corpus:

- 323 calls processed (brief said 332; my counter dedups across
  sections + recent_examples — variance lives in the dedup edge cases)
- 101 codex sections lit (exact)
- 525 cherry-pick moments (brief said 1,432; V1 only renders the
  recent_examples top-N per node — V1.5 can load per-call cherrypicks
  to surface the full ~1.4K)
- 3 gray-matter exemplars (matches the 3 presumptive; the other 4
  awaiting-Kenny entries aren't in the data yet)

## RESOLVED (2026-05-22)

1. **Dark theme** — keep. Strategy Claude's WebFetch flattened styling into
   content-readable form; the override to match existing pages was right.
2. **Brain mock data** — keep for V1. Real data ships with Clerk
   integration.
3. **Remotion paths locked:** `public/ion/brain-walkthrough.mp4` +
   `public/ion/brain-walkthrough-poster.jpg`. Wired in
   `src/app/ion/(public)/page.tsx`. Future per-prospect demos follow the
   same convention under `public/{tenant}/`.

Items 4 (StageBBanner + dead-CTA scan) and 5 (orphan token routes:
tree/[clusterId], manager, leader, owner, rep, plus wiki/page.tsx)
were resolved in the cleanup pass per `BRIEF_stream_b_cleanup.md`.
StageBBanner deleted; 7 orphan pages deleted; 10 orphan components
deleted; surviving `[token]/layout.tsx` brand-mark href rewired to
`/ion`. Build clean (`npx tsc --noEmit` + `npx next build`), surviving
routes serve 200, all deleted routes serve 404. Content captured into
`legacy-pitch-content-v2.md`.

---

## ORIGINAL OPEN QUESTIONS (for history)

## 1. Brief said "white background, dark text" but existing pages are dark

The brief's design-system block specified:

> **Background:** white
> **Text:** dark, high contrast

But the actual existing `/ion/k/{token}/...` pages are a **dark theme**
(`stewart-bg: #0f1117`, `stewart-text: #e2e8f0`), the global Clerk theme
is `dark`, and every existing component assumes dark.

Since the brief also said "match existing `/ion/` pages" and "do NOT
refactor existing styling patterns," I matched the dark theme. If Spencer
genuinely wants a white-bg redesign for the public pitch, that's a bigger
change than scaffolding and should land in its own PR with explicit
restyling of the shared components (`StewartCallout`, `TreeDetailCard`,
brain components, etc.) — they all currently bake the dark palette.

**Action:** confirm dark theme is correct, or flag for a separate restyle PR.

## 2. Brain page — mock data vs real data

`/ion/brain` renders `buildMockGraph()`. The real brain endpoint is
HMAC-token gated and not reachable from a public route without backend
changes. Two paths exist (see `scaffolding-decisions.md` § Brain mirror).
Out of scope here, but a real demo to Kenny probably wants real data on
this page.

**Action:** when ready, decide between (a) demo viewer token or (b)
server-side proxy with service credentials.

## 3. Section 4 Remotion video file location

Section 4 has a `<video>` placeholder with `poster="/ion/brain-poster.png"`.
That asset doesn't exist yet (the brain Remotion render is deferred). The
`<video>` element won't load a source until the render lands. Plan for the
final file convention:

- Render output → `public/ion/brain-walkthrough.mp4`?
- Poster → `public/ion/brain-poster.png`?

**Action:** Strategy Claude/Spencer pick the final filenames so the
`<video>` `src` and `poster` paths can be wired in one edit.

## 4. Orphan `tree/[clusterId]` pages

Deleted `tree/page.tsx` but kept `tree/[clusterId]/page.tsx`. The dynamic
subpages still resolve but can't be navigated to from any deleted parent
— they were always reached via deep-link or click-through from the tree
page. Spencer might want them deleted too if they're truly orphaned, or
kept if direct-link sharing was the actual use case.

**Action:** keep or delete the dynamic cluster pages? Same question for
the role-based views (manager/leader/owner/rep) — those reach off the
deleted token landing too, but are likely still needed for internal demos.

## 5. StageBBanner — keep on token routes?

Left in place on the surviving token routes. It pitched "send the next
batch" toward the now-deleted `next-steps` page — if the banner's CTA
points to a dead route, it'll need updating. Did not look at its body —
flagging in case it needs a sweep.

**Action:** review `_components/stage-b-banner.tsx` content and update or
remove CTAs that pointed to deleted pages.

## 6. MDX or plain TSX for content drops?

Brief mentioned `content/ion/section-*.mdx` paths. The repo doesn't have
`@next/mdx` configured. Two options for the content pass:

- **Plain TSX (recommended for the first pass):** Strategy Claude edits
  `src/app/ion/(public)/page.tsx` directly, replacing each section's
  `todoNote` prop with real children. Zero new deps.
- **MDX:** install `@next/mdx`, set up the loader, move content into
  `.mdx` files. Better long-term authoring isolation, costs ~30 min of
  setup.

**Action:** Strategy Claude picks. If MDX, scaffolding Claude can do the
setup in a follow-on PR — flag it before drafting content.
