# Codex Updates — for Kenny + Spencer review

**Date:** 2026-05-22
**Author:** Stewart's pattern analyzer + Spencer's operator catch
**Status:** Proposed — awaiting Kenny + Spencer approval before codex update

---

## What this document is

Stewart processed your 332-call curated Ion Solar corpus (the set you sent Spencer + a few additional batches he pulled from earlier shares) through the post-pivot trajectory-synthesis pipeline. *Note: this is your curated set, not a random floor sample — Bucky over-represented (58 calls) because you sent more of his; future Stewart runs against the live Five9 stream will be representative.*

Two analytical outputs emerged that should inform the next version of the codex:

1. **7 new classification categories** identified by Stewart's pattern-analyzer pass over the 775 cherrypick moments that were classified as `other`. These are real recurring patterns the V1 enum didn't capture.
2. **1 Spencer-identified operator pattern** (`softener_overuse`) that Stewart counted across the corpus and ranked.

Plus this is the single review surface for the **22 open TBD sections** in the codex that Kenny still needs to populate during the embedded build phase.

Once Kenny signs off, the codex updates land in `config/codex/codex_v1.0_solar_skeleton.yaml` and Stewart's Stage 3 enum updates to match. Any subset of the 332 calls can be re-processed against the expanded codex to surface previously-buried patterns.

---

## Part A — Proposed new classifications (from pattern analyzer)

Stewart's analyzer ran Sonnet over a stratified sample of 80 of the 775 `other`-classified moments, with the existing codex as context. It identified **7 recurring structural patterns** that warrant their own categories. Heterogeneity note: ~15-18 of the 80 sample moments did NOT cluster (transcription glitches, open-mic artifacts, single-instance edge cases) and should remain in `other`.

For each category below: definition + coaching implication + 3 example call_ids + frequency estimate in the sample.

### 1. `setter_scope_creep`

**Definition:** Rep volunteers closer-tier content (product features, financial mechanisms, warranty/cost rationales) before the customer asks OR in response to a question that should be redirected to the specialist. Different from `protocol_violation` because the content is accurate-but-premature — the failure mode is giving away appointment value, not breaking a procedural rule.

**Coaching implication:** Drill the universal escape hatch ("that's exactly what the specialist will walk you through"). The pattern compounds — once a rep answers one technical question, the next is more specific, and they're three exchanges into closer territory before realizing the drift.

**Sample frequency:** 12 of 80
**Example moments:**
- `session15_c55febbd @ 02:39` — "And we don't do ground mounts here just because they are super expensive and ult..."
- `session8_c1f36478 @ 01:18` — "Unfortunately, we we actually don't anymore. We've kinda moved away from ground..."
- `10000587120 @ 01:33` — "their upfront cost is just gonna be eliminated completely..."

### 2. `intro_legitimacy_omission`

**Definition:** Rep opens the call without establishing company identity, lead source, or credibility anchor in the first 30 seconds. Includes cases where the company name is mentioned but no context (state, referral, certified-installer framing). The intro's primary job is to answer "is this a scam?" — and cooperative customers tolerate a weak intro while skeptical customers drop here.

**Coaching implication:** Check whether this is a habit pattern across the rep's full call history. The fix is a two-sentence anchor (company + state + lead source) that takes under 10 seconds and materially changes the call's trust baseline.

**Sample frequency:** 9 of 80
**Example moments:**
- `session4_3d4e75c7 @ 00:35` — "I work with our design team here to create solar estimates..."
- `session2_77086e3f @ 00:03` — "Hey, David. This is Holland with Ion. So I just got a request..."
- `session27_2b25735d @ 00:05` — "Hey. I'm doing pretty good. Yeah, William. I was just reaching out from Ion Solar..."

### 3. `objection_inversion_miss` ⚠️ THE BIG ONE

**Definition:** Customer states a cost / skepticism / prior-experience objection that maps to the codex's objection_inversion trigger (the structural pattern where the financial argument against solar is the same financial argument FOR it). Rep accepts the objection at face value, validates it, or pivots to feature explanation instead of deploying the bill-as-villain reframe.

**Coaching implication:**
> **Stewart's corpus analysis found ZERO instances of the objection_inversion move being executed across the full 332-call corpus.**
>
> This is the codex's highest-leverage daily coaching contribution and it is completely absent from the floor. This is a floor-wide training gap, not a per-rep coaching note. The inversion concept — *"the financial argument against solar is the same financial argument for it"* — needs to be drilled until reflex.

**Sample frequency:** 8 of 80 sample (the trigger moments where the move should have been used)
**Example moments:**
- `session22_8d5e19a7 @ 00:16` — "It's not worth it. It doesn't make sense financially for me."
- `session28_23812db1 @ 02:11` — "Perfect. Yeah. Thank you. And you're I mean, you're totally right..."
- `session26_3f71f076 @ 05:12` — "Yeah. Yeah. It it never turns into free."

### 4. `prior_contact_probe_miss`

**Definition:** Customer discloses a prior solar conversation, quote, design, or promise from another company (or prior Ion touch); rep acknowledges but does NOT probe for competitive intelligence (which company, what was shown, what happened, customer reaction). Different from `knowledge_gap` because rep isn't missing product knowledge — missing competitive-context extraction that would sharpen the closer's opening frame.

**Coaching implication:** Every prior-contact disclosure is free competitive intelligence. A single follow-up question costs 15 seconds and gives the closer a material advantage. Drill as a `verify.prior_designs` reflex: hear "I talked to someone" → ask one probe question before moving on.

**Sample frequency:** 7 of 80
**Example moments:**
- `30000166799 @ 04:41` — "I talked to one guy, and they were talking about, I'm gonna have a trail..."
- `session22_8b7fac1d @ 01:14` — "He didn't tell me. He said, it was, a grant or something..."
- `session2_22486ddd @ 01:00` — "So are you a, how you call it, PPA or or you sell the system?"

### 5. `unanchored_soft_exit`

**Definition:** Call ends without a locked appointment time, a verbal "is that fair?" handshake, or a confirmed next-step OWNED BY the rep. Different from `conditional_booking` (where there's a real unresolved customer barrier) — this is procedural fragility, missing the handshake mechanics. Includes passive closes like "look forward to hearing from you" instead of "I'll send you a text confirming Thursday at 2."

**Coaching implication:** The "is that fair?" handshake is the single highest-leverage button-up mechanic — converts passive agreement into active yes, and an active yes predicts the sit. Track sit rate by rep and correlate with button-up execution quality.

**Sample frequency:** 8 of 80
**Example moments:**
- `session8_d20b746b @ 07:55` — "work with you from there. If you like it, we can help you get it going..."
- `session2_31dbc423 @ 00:53` — "Okay. Yeah. We can do that. I'll get that down for, Friday at three."
- `10000811924 @ 05:03` — "Yeah. So I'll send you a text in, Matthew, and then, yeah, just kinda check on..."

### 6. `non_standard_scenario_hold`

**Definition:** Rep places a customer on hold mid-call to consult a supervisor because the customer's situation falls outside the standard new-solar-install script (off-grid, battery-only, manufactured/mobile home, removal/reinstall, cash-buyer). Different from `knowledge_gap` because the gap is specifically in non-standard scenario recognition and routing, not general product knowledge.

**Coaching implication:** Two or more supervisor holds in one call with a warm buyer erodes credibility at the worst moment. Build a non-standard scenario quick-reference covering the 5 most common edge cases with a defined routing action for each.

**Sample frequency:** 5 of 80
**Example moments:**
- `session12_bc3b204c @ 06:31` — "If you'll just actually give me one sec. I just wanna ask my supervisor..."
- `session1_718cbcf3 @ 00:28` — "the person said that, you guys have a Delta solar panel for me to take a look at"
- `session4_6c84da86 @ 00:55` — "No. We're not looking to expand. We're doing a home renovation..."

### 7. `curiosity_creation_failure`

**Definition:** Customer hands the rep an anchor (kWh number, bill amount, prior quote, neighbor's system) and the rep either files the data silently, delivers a generic feature-adjacent comment, or moves to the next verify item instead of reflecting the moment back as a forward-pulling hook. Different from `bill_anchor` (which covers failure to collect) — here the data has already been disclosed; the failure is conversion to motivation.

**Coaching implication:** The codex's curiosity_over_features principle is the setter's primary value-creation tool, but requires the rep to recognize when a customer has handed them anchor material. Drill the "reflect and forward-pull" habit: hear a number, say it back with a forward frame ("13,000 kWh a year — that's exactly the kind of usage where the design gets interesting. Let's get you on the calendar").

**Sample frequency:** 7 of 80
**Example moments:**
- `20000445648 @ 02:46` — "I have I pay 2 to $100 per month. I use 13,000 kilowatt hours per year."
- `10000538705 @ 00:40` — "There was an ad on the Internet that Colorado gave you $30,000 to put on solar."
- `10000348391 @ 03:28` — "the equipment has gotten, you know, a lot better. So, yeah, I think it's gonna b..."

---

## Part B — Spencer's operator catch: `softener_overuse`

**Pattern attribution: Spencer (13 years phone sales experience, including watching his son onboard at Ion).**

**Spencer's framing:**
> "I noticed reps using 'kinda' to soften direct statements. It sounds unprofessional — like the rep isn't sure of what they're selling. My son started doing it at Ion. I told him to stop. The quality of the call goes way up when you drop it. So does the rep's confidence."

**Stewart's corpus-wide count (332 calls):**

| Metric | Rep | Customer |
|---|---|---|
| "kinda" instances | 207 | 99 |
| "kind of" instances | 107 | 64 |
| **Total** | **314** | 163 |
| Per 1K words | 2.23 | (varies — customers talk less measurably) |

**Top 5 rep offenders by total softener count:**

| Rep | Calls | Total | Per 1K words |
|---|---|---|---|
| **Parker** | 26 | 74 | **6.11** |
| Holland | 37 | 47 | 2.18 |
| Randy | 19 | 33 | 2.46 |
| Bucky | 57 | 24 | 1.19 |
| Tyke | 10 | 24 | 4.33 |

**Worst single call:**
`session24_672c78b5` — Parker — 12 softeners in 9 minutes

**Example moments:**
- Parker @ 02:04 — "...maybe five years ago, they used to buy it back a lot. It's just kinda been a changing program since then."
- Parker @ 03:08 — "That's kinda why we build the design. That's why we give you a call. We get some information, and then we would have our specialist kinda run through..."

**Recommended codex placement:** Add as a new entry under `coaching_philosophy.verbal_discipline` (new sub-section). Stage 3 classification: `softener_overuse`. Flag at 3+ instances in a single conversation segment, not isolated uses.

---

## Part C — The 22 outstanding TBDs Kenny still owes

These are the explicit gaps Kenny needs to fill during the embedded build phase to move the codex from skeleton-with-gaps to production-ready textbook. Listed in source order. Each location is annotated with the line number in `config/codex/codex_v1.0_solar_skeleton.yaml`.

| # | Location | What's needed from Kenny |
|---|---|---|
| 1 | `context.market_geography` (L59) | Ion-specific demographic patterns per market |
| 2 | `context.competitive_landscape` (L66) | Full competitor list per region |
| 3 | `context.seasonality.bill_pain` (L72) | Winter heating-bill spike pattern (Stewart saw $621 in SESSION6) |
| 4 | `context.ion_offerings_beyond_setter_call` (L88) | Full service catalog (warranties, financing, etc.) — Tesla relationship now RESOLVED 2026-05-15 |
| 5 | `context.setter_compensation_model` (L135) | Pay plan document, tier thresholds, per-setter tier data, pay-period start date |
| 6 | `context.lead_types_and_bill_collection_rules` (L176) | Full lead-type taxonomy at Ion, bill-on-file routing rules, recycled lead workflows |
| 7 | `context.what_good_looks_like` (L224) | Real Ion calls Kenny designates as exemplary per section — these become "gray matter" |
| 8 | `qualifiers.credit_qualifier` (L510) | Bureau-pulled vs stated credit policy; clarify setter-DQ vs closer-decides |
| 9 | `rebuttals.{tbd}` (L645) | hidden_costs_anxiety, data_mining_concern, tesla_expectation_gap_reframe, scammer_anecdote_reframe |
| 10 | `protocols.{tbd}` (L702) | excessive_contact_complaint, vulnerability_disclosure, scam_encounter_reference |
| 11 | `cross_sell_signals.{tbd}` (L735) | battery_storage_inquiry, solar_for_secondary_structure, net_metering_interest |
| 12 | `coaching_philosophy.bill_anchoring.examples` (L810) | Specific phrasings from top-performer recordings |
| 13 | `coaching_philosophy.multi_angle_resilience` (L830) | What does 3+ angles look like at Ion specifically? |
| 14 | `coaching_philosophy.empathy_on_vulnerability` (L859) | Ion's exemplar phrasings for each vulnerability type |
| 15-22 | `coaching_philosophy.what_great_looks_like` + `what_failure_looks_like` (L937, L954) | PARTIAL sections populated from corpus; Kenny adds his coaching voice |

Plus the new Part A categories above (which become 7 additional codex entries once Kenny approves).

---

## How to use this document

**For Kenny's review session with Spencer:**

1. Walk Part A — the 7 new categories. For each, listen to one of the example moments. Approve / reject / refine name + definition.
2. Walk Part B — the softener pattern. Confirm the codex placement under `coaching_philosophy.verbal_discipline`.
3. Walk Part C — the 22 TBDs in source order. Spencer + Kenny work through them during the embedded build phase, one or two per weekly synthesis call.

**After Kenny's review:**

1. Approved Part A categories → Stewart's Stage 3 tool schema already has them (added 2026-05-22). The codex sections need to be added (one section per category, with definition / examples / coaching_implication / sample call_ids).
2. Approved Part B softener pattern → add to `coaching_philosophy.verbal_discipline` with Parker examples.
3. Each TBD Kenny answers gets folded into the codex; Stewart's next reads pick it up.

**Reprocessing decision:** Once Parts A + B are in the codex, you can:
- Reprocess a subset of calls (sample 50?) to see how many "other" classifications get correctly remapped — validation pass
- Reprocess the full corpus to surface the now-detectable patterns (~$50-100 cost; produces a much richer brain) — this is optional and post-contract

---

## Cost summary so far (for VP transparency)

| Pass | Calls | Cost |
|---|---|---|
| Demo set initial (7 calls, Sonnet+Sonnet) | 7 | $3.59 |
| Step B novel calls (5 calls) | 5 | $1.80 |
| Step C SESSION-prefixed batch | 259 | $101.48 |
| Step C-prime numeric batch | 61 | $21.47 |
| Pattern analyzer (this proposal) | — | $0.16 |
| **TOTAL** | **332** | **$128.50** |

Reprocessing all 332 against the expanded codex (post-Kenny-approval): ~$130 additional.
