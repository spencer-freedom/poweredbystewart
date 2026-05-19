# Scaffolding Decisions — `ion-scroll-demo` branch

Recorded for Strategy Claude so the content drops slot in without surprises,
and so Spencer doesn't have to chase the reasoning later.

## Route layout

Used a **Next.js route group** at `src/app/ion/(public)/`. URLs resolve at
`/ion`, `/ion/whats-next`, `/ion/brain` (the `(public)` segment doesn't
appear in URLs). This was the only way to give the new public pages their
own layout without nesting inside the existing `/ion/k/[token]/layout.tsx`
(which would have double-rendered the header).

```
src/app/ion/
├── (public)/                      ← new, public, no auth
│   ├── layout.tsx                 ← header + footer, single "What's Next" link
│   ├── page.tsx                   ← /ion — 6-section scroll
│   ├── whats-next/page.tsx        ← /ion/whats-next — scope of work
│   ├── brain/page.tsx             ← /ion/brain — public brain mirror
│   └── _components/
│       └── scroll-section.tsx     ← reusable section wrapper w/ TODO marker
├── k/[token]/                     ← surviving token-gated routes
│   ├── layout.tsx                 ← updated: IonNav removed (pointed at deleted tabs)
│   ├── leader/                    ← untouched
│   ├── manager/                   ← untouched
│   ├── owner/                     ← untouched
│   ├── rep/[rep_id]/              ← untouched
│   ├── tree/[clusterId]/          ← untouched (parent tree/page.tsx deleted)
│   ├── wiki/                      ← untouched
│   └── _components/               ← ion-nav.tsx deleted, rest untouched
```

## Where to drop content

Strategy Claude can drop content directly into the six `ScrollSection`
calls in `src/app/ion/(public)/page.tsx`. The `todoNote` prop is what
renders the visible amber "TODO" block today — replace those with real
children. The section structure (eyebrow / title / TODO block / optional
children) is already wired.

If MDX is preferred (matches the brief's suggested `content/ion/section-*.mdx`
convention), no MDX support is configured in this repo yet — `@next/mdx`
would need to be added first. The current page is plain TSX; that's the
path of least resistance for the first content pass. Recommend doing one
content pass in plain TSX first, then converting to MDX only if Strategy
Claude wants per-section authoring isolation later.

JSON pipeline outputs (`session10-manager-brief.json` etc.) should land in
`public/ion/` so they can be statically served and fetched client-side.
The card grid placeholders in § 2 are already shaped 3-wide for those.

## Design system

**Matched the existing dark theme**, NOT the white/dark spec in the brief.
The existing `/ion/` pages use:

- `bg-stewart-bg` (#0f1117)
- `bg-stewart-card` (#1a1d27)
- `border-stewart-border` (#2a2d3a)
- `text-stewart-text` (#e2e8f0) / `text-stewart-muted` (#94a3b8)
- `text-stewart-accent` (#3b82f6 blue)
- `text-stewart-warning` (#f59e0b amber) — used for TODO markers
- `text-stewart-success` (#22c55e) / `text-stewart-danger` (#ef4444)

The brief's "white background / dark text" instruction was likely a
misremembering — applying it would have broken the "match existing pages"
constraint, the Clerk dark baseTheme, and the existing component styling
(every component assumes dark). Flagged in `notes/open-questions.md` —
revert is trivial if the white-bg call was deliberate.

The status palette (`worked / partial / failed / unobserved`) requested in
the brief doesn't have direct equivalents in the existing token system —
the closest are `stewart-success / warning / muted` (and the tree page's
own `bg-violet-300 / bg-sky-200 / bg-rose-300` for graph swatches). The
mapping is left for whoever wires the call-outcome cards.

## Brain mirror — mock data

`/ion/brain` uses `buildMockGraph()` from
`src/app/ion/k/[token]/_components/brain/brain-mock.ts`. The real graph
endpoint is HMAC-token gated; a public route has no token to authenticate
with. Two future paths if real Ion data needs to render publicly:

1. Backend mints a long-lived "demo viewer" token with read-only scopes,
   embedded server-side in the page.
2. Server-side proxy: `/ion/brain` runs as a Server Component, calls the
   backend with service credentials, never exposes the token to the client.

The `BrainOrchestrator` token prop is empty string today. It's used
downstream for HMAC-signed audio URLs only — audio playback won't work in
the public mirror until one of the two paths above lands.

## Token-gated layout cleanup

`src/app/ion/k/[token]/layout.tsx` had its `<IonNav>` removed because the
nav's four tabs (Methodology / Decision Tree / Next Steps / What's Coming)
were all deleted in this PR. The remaining token routes (manager, leader,
owner, rep, wiki, tree/[clusterId]) don't appear in IonNav anyway — they
were always reached by direct link — so removing the nav is a no-op for
them. The `<StageBBanner>` was left in place; it still serves the surviving
routes.

`_components/ion-nav.tsx` was deleted (no remaining importers).

## Anchor IDs without visible nav

Per the "pure scroll" brief update, each `<section>` has an `id` attribute
but there is no visible nav strip. The `id`s exist solely so Spencer can
share direct links like `https://.../ion#thesis`. `scroll-mt-24` is
applied to each section so deep-links land below the sticky header rather
than under it.

## Verification snapshot

Run on this branch:

- `npx tsc --noEmit` — clean exit 0
- `npm run dev` — Ready in 1142ms, no warnings
- `GET /ion` → 200, contains all 6 anchor IDs, links to `/ion/whats-next` twice (header + § 6 CTA)
- `GET /ion/whats-next` → 200
- `GET /ion/brain` → 200, brain canvas renders against mock
- `GET /ion/k/sample-token/wiki/brain` → 200 (existing route untouched — renders the role-gated denial for an invalid token, which is the correct behavior)
- `GET /ion/k/sample-token` / `/tree` / `/next-steps` / `/preview` → 404 (deleted)

Mobile responsiveness verified by class inspection (everything uses
`max-w-6xl mx-auto px-6` and the section spacing collapses on `sm:`
breakpoints). A live 375px viewport pass is recommended before sending
the URL to Kenny.
