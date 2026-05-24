# Legacy Pitch Content v2 — orphan token routes (deleted in cleanup pass)

> Continuation of `legacy-pitch-content.md`. Captures reusable copy from
> the orphan token-routed pages deleted in the cleanup commit on
> `ion-scroll-demo`. Strategy Claude may want to mine these for section
> copy or for future role-based surfaces.

---

## tree/[clusterId]/ — Cluster Detail (decision-tree drilldown)

### Page title
{cluster name}

### Page description
{cluster description}

### Outcome breakdown headline structure
- N calls
- N won (X%)  ← green
- N lost      ← red
- N engaged / callback  ← yellow
- {lift} pts vs. {macroPct}% macro  ← right-aligned, color by sign

### Outcome chip rendering
Each outcome key shown as `{outcome with underscores → spaces}: {count}`,
color-coded:
- Wins (booked, tentative_appointment, transferred_to_closer) — green
- Losses (declined, no_interest, unqualified) — red
- Engaged middle states — yellow

### Section: "Winning word tracks"
Each track card:
- `approach_label` or `#{rank}` badge (top-left, accent border)
- Verbatim quote (italicized, leading-relaxed)
- **Why it works:** {why_it_works}
- Footer meta: "From call {source_call_id}" · "rep {source_setter_id}" · "{sample_size} example(s)"
- Audio clip widget if start/end seconds exist
- "Audio examples gallery — N example(s) of this track across calls" expandable section

Empty-state copy: "No winning word tracks extracted for this cluster yet."

### Section: "What didn't work — losing patterns"
Intro: "Verbatim lines from calls in this cluster that ended without an
appointment. The contrast against the winning tracks above is the
training signal."

Each card:
- Verbatim quote (italic)
- **What went wrong:** {what_went_wrong}
- Footer: "From call {source_call_id}"

### Section: "Observed attempt-1 → attempt-2 transitions"
Each transition shows:
- `#{parent_rank} → #{next_rank}` or `(no follow-up)`
- Condition tag: failed/partial/[success] (color by tone)
- Sample size + transition rate
- Note copy

---

## manager/ — Manager Weekly Coaching (placeholder)

ComingSoon stub. Surface label: "Manager Weekly Coaching". Blocked on:
`GET /api/ion/coaching-prep`.

---

## manager/[rep_id]/[call_id]/ — Coaching Prep

### Eyebrow
Coaching prep · rep {rep_id} · call {call_id}

### Title
Session ready

### Body
Renders `<ComposerOutput data={prep} />` — the manager-side composer brief
(structure lives in the ComposerOutput component, which is also being
deleted; the data shape is defined by `fetchCoachingPrep` in stewart-api).

### CTA at bottom
"See this call as a graph + similar successful examples →" linking to
`/ion/k/{token}/wiki/brain`.

---

## leader/ — Sales Leader · Floor Analytics

### Eyebrow
Sales Leader · Floor Analytics

### Title
Floor-wide patterns

### Intro stat line
"{n_real_sales} engaged conversations · {macroPct}% macro close rate ·
{N} objection clusters identified."

### Killer-insight callout
First sentence of `data.executive_summary` rendered through `StewartCallout`
with `kind="pattern"`.

### Pipeline funnel (5 stats)
- received
- real conversations (with % of received)
- wins (with % of real, success-toned)
- engaged · no set (with % of real)
- hard losses (with % of real, danger-toned)

### Objection cluster table
Columns: Cluster · Calls · Win rate · vs. floor · Outcome breakdown
Color swatch by lift vs. macro:
- ≥10 pts above floor — emerald
- within 10 pts — neutral
- ≥10 pts below floor — rose

Badges: "most frequent" (accent) and "weakest signal" (warning) on
appropriate rows.

### Two-column section
- Top winning word tracks: ranked card list with rank, cluster name,
  sample size, est win rate, verbatim (truncated 140 chars).
- What's not working: losing-pattern cards with cluster, source call,
  verbatim (truncated 130), why-it-failed (truncated 140).

### Deferred surfaces callout
"Per-rep trend lines and manual curation surfaces (cluster promote/
demote, canonical word-track marking) light up when the leader-dashboard
endpoint ships." — `<StewartCallout kind="wip">`

---

## owner/ — System Owner · Cross-Tenant (placeholder)

ComingSoon stub. Surface label: "System Owner · Cross-Tenant". Blocked
on: "token role=system_owner gating + cross-tenant aggregate API".

---

## rep/[rep_id]/ — Rep Daily Training

### Eyebrow
Daily training · {rep_id}

### Title
Today's focus

### Body
Renders `<ComposerOutput data={brief} />` from `fetchTrainingBrief`.

---

## wiki/ — Pattern Wiki (parent page, NOT brain)

### Title
Pattern Wiki

### Intro
"{N} objection clusters · {N} winning word tracks · {N} losing patterns.
Dashed violet edges connect tracks that came from the same call."

### Stewart callout (kind="wip")
"The full cross-call traversal lights up when Archivist finishes
processing. This view is the cluster overview in the meantime."

### Body
`<WikiGraph data={data} token={token} />` — multi-expand cluster graph
using reactflow. Component being deleted alongside this page.

### Footer caption
"Click a cluster to collapse it. Click a winning track or losing
pattern to read the verbatim and play the audio. Pan + scroll to zoom."

---

## StageBBanner (component, deleted)

> "Stewart is running deeper analysis on your latest calls. Thanks for
> your patience — you'll love what's coming."

Pulsing amber dot, used to live above main content in the token layout.
Was tied to the pre-pivot pitch flow. Strategy Claude's call: delete
entirely; the new scroll page replaces this affordance.
