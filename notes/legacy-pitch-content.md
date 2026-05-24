# Legacy Pitch Content — captured before deletion

> Source: the four legacy `/ion/k/{token}/` tab pages (Methodology, Decision Tree,
> Next Steps, What's Coming) that were retired in the `ion-scroll-demo` PR.
> Strategy Claude can mine these for reusable copy when filling in the new
> scroll-page section content.

---

## Tab 1 — Methodology (`/ion/k/{token}/page.tsx`)

### Eyebrow
Hi Kenny — built on your floor's calls

### Hero (data-driven)
The biggest pattern in your floor: **{lead cluster name}** — {win_rate}% win
rate across {frequency} calls.

{N} winning word tracks across {N} objection categories. Every line is a
verbatim quote from one of your reps.

### Stats strip
- sales conversations
- advances (accent)
- objection clusters
- winning word tracks
- losing patterns

### Section: "What this is"
**An empirical sales playbook — built on your floor, not theory**

- **Every winning track is a verbatim quote**, attributed to the rep who said
  it and the call it came from. Click any track in the Decision Tree to hear
  the actual audio.
- **Every objection cluster came from how your prospects actually push back**,
  not from a generic objection-handling script. {N} categories drawn from {N}
  real sales conversations.
- **Win rates are observed outcomes**, not opinion — {N} appointments booked,
  {N} engaged-no-set, {N} hard losses. The math is your floor's, not ours.

### Section: "What it does for your floor"
**Replace coaching opinions with what actually works on your calls**

- See **exactly what your top performers say** when {lead objection} comes up
  — and what your strugglers don't.
- Train new setters on **the objections that actually move appointments**,
  sorted by frequency. No more time wasted on rare edge cases.
- Catch **losing patterns** — what your reps say right before a prospect
  declines. {N} examples already flagged across the {N} clusters.
- Scale to all **35 setters** with a per-rep daily training brief built on
  their own previous-day calls — once Stage B lands.

### Section: "What unlocks Stage B" (warning tone)
**Why we need a bigger sample to productionize this**

{N} calls is enough to find patterns. It's not enough to call them
statistically validated, and it's definitely not enough to coach individual
reps from. Stage B fixes that.

- **Most winning tracks are n=1** — one example each. The pattern is real,
  but more reps repeating it is what tells us it scales beyond the rep who
  originated it.
- **No per-rep view yet** — without Salesforce `Activity.OwnerId`
  attribution, every track is anonymous. We can't tell Alex apart from
  Marcus.
- **Stage B = 200+ wins + 200+ engaged losses + setter attribution**. That's
  the dataset that turns this from a directional read into a per-rep daily
  training engine across your full floor.

### Footer
Built on 47 real Ion Solar inside-sales calls. Patterns are directional until
replicated on a larger dataset. Powered by Stewart — SalesOS.

---

## Tab 2 — Decision Tree (`/ion/k/{token}/tree/page.tsx`)

### Title
Decision Tree — {N} Objection Clusters

### Legend
- Violet: Objection cluster
- Sky: Winning word track
- Rose: What didn't work

### Caption
Animated green edges between word tracks are observed second-attempt
patterns that worked. Dashed amber/red are partial or failed follow-ups.

### CTA
→ Send the next batch (200+ filtered calls) to productionize this

---

## Tab 3 — Next Steps (`/ion/k/{token}/next-steps/page.tsx`)

### Title
To productionize this for your full 35-setter floor, here's exactly what we
need:

### Intro
~10 minutes of Salesforce admin work + a one-time audio export. Everything
below is what flips this from a 47-call directional read into a per-rep
daily training engine.

### Step 1 — Salesforce report A — winning calls
- Filter: CallDuration > 60 seconds
- Filter: Outcome = "Appointment Set"
- Date range: last 60-90 days
- Target volume: 100+ calls

### Step 2 — Salesforce report B — engaged losses
- Filter: CallDuration > 60 seconds
- Date range: last 60-90 days
- Target volume: 100+ calls

Engaged losses are where your rep got past gatekeeping but didn't close. The
contrast between wins and engaged losses is what tells us what your top
performers say right before the prospect books — and what your strugglers
say right before the prospect walks.

### Step 3 — Required CSV columns on both reports
- Activity.Id
- Activity.OwnerId
- Activity.OwnerName
- CallDuration
- Outcome
- CallDate

Activity.OwnerId and OwnerName are what enable per-rep coaching. Without
them every winning track is anonymous and we can't tell Alex from Marcus.

### Step 4 — Drop the audio files here
Tag each batch as wins or engaged losses. Re-uploading the same call twice
is harmless — we'll catch it.

### "What you get back"
A per-setter scorecard for every one of your 35 reps, their single biggest
opportunity cluster, and a daily training brief built on their own
previous-day calls. See the "What's Coming" tab for what each rep's view
will look like. Turnaround once your batch lands: 24-48 hours.

---

## Tab 4 — What's Coming / Preview (`/ion/k/{token}/preview/page.tsx`)

### Title
What each of your 35 setters will see in 30 days

### Intro
The view below is mocked — real per-rep data lights up after the filtered
batch lands with Salesforce attribution. Every rep gets a personalized
scorecard, their single biggest opportunity cluster, and a daily training
brief built on their own calls.

### Per-setter scorecard structure (mock data)
- Name + role
- Close rate (large number)
- Top opportunity
- Weakest cluster (with % rate; danger tone)
- Top performer (with % rate; success tone)
- Daily training prescription: which clip to listen to + which framing to
  practice

Sample reps used:
- Alex Rivera — 28% close, top opp Roof Concerns, weakest 18% on Roof
  Concerns, top performer 71% on same, warranty-backstop framing
- Marcus Bell — 41% close, top opp Scheduling Availability, weakest 22% on
  Spousal/Co-Decider, top performer 66%, two-slot-offer framing
- Priya Shah — 52% close, top opp Price/Affordability, weakest 31% on same,
  top performer 74%, savings-vs-bill framing

### Sample daily training brief — structure
SUBJECT — You're {gap} points behind on {cluster} — here's what {top
performer} does differently

YESTERDAY — {N} calls touched {cluster} · {N} advances · all {N} ended after
the prospect mentioned {pattern}

PRIYA'S WINNING TRACK — verbatim quote, italicized, with accent left border

PRACTICE TASK — On your next 3 {cluster} calls, lead with the {framing}
within the first 90 seconds. Recordings will be auto-tagged for tomorrow's
brief.

YOUR PROGRESS — progress bar showing rep's % vs top-performer's %

### "The shape of the rollout"
Each of your 35 setters gets a personalized version of the brief above,
every morning, drawn from their own previous-day calls contrasted with the
top-performer playbook for the same objection cluster. Coaching becomes
empirical — built on what actually works on your floor, not generic sales
theory.

Send the next batch on the Next Steps tab and we'll have your full taxonomy
and per-rep scorecards built within 48 hours of the batch landing.

---

## Layout chrome (also retired)

- Header brand line: "Powered by Stewart" × "Ion Solar"
- Subtitle: "Inside-Sales Decision Tree · Built on your call data"
- IonNav tabs: Methodology / Decision Tree / Next Steps / What's Coming
- StageBBanner above main content (unclear if this should carry into the
  new scroll page — left as an open question)
- Footer disclaimer: "Built on 47 real Ion Solar inside-sales calls.
  Patterns are directional until replicated on a larger dataset. Powered
  by Stewart — SalesOS."
