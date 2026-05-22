# Open Questions — `ion-scroll-demo` branch

Questions surfaced during scaffolding. Spencer or Strategy Claude can
resolve and the scaffolding Claude (or follow-on pass) will adjust.

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
tree/[clusterId], manager, leader, owner, rep) are pending a follow-up
brief from Strategy Claude per the 2026-05-22 review. Coding-Claude pick
is queued and will execute on receipt of that brief.

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
