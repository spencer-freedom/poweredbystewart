// Locked content from /mnt/c/Users/Spencer Colby/OneDrive/Desktop/Ion_Setter_Schema.md
// Lifted verbatim — no paraphrasing. Update this file when the schema
// itself moves; do not let LLM rewrites mutate it during code edits.
//
// The italic word-track examples in maturity-ladder bodies use the
// markdown convention `*"…"*` — the renderer pulls them out as inline
// blockquotes. Keep that marker shape stable; the parser depends on it.

export type InvariantId =
  | "intro"
  | "anchor"
  | "match"
  | "reframe"
  | "qualifier"
  | "button_up";

export type MaturityLevel = {
  label: "Mechanical execution" | "Adaptive execution" | "Advanced salesmanship";
  // Optional named-move tag appended to the tier label
  // (e.g. "pattern interruption" on Intro L3). Renders as
  // "L3 · Advanced salesmanship · pattern interruption".
  descriptor?: string;
  body: string;
};

export type Invariant = {
  id: InvariantId;
  number: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  core_question: string;
  job: string;
  failure_state: string;
  maturity: {
    l1: MaturityLevel;
    l2: MaturityLevel;
    l3: MaturityLevel;
  };
  stewart_detection: string;
  economic_impact: {
    primary_kpi: string;
    secondary_kpi: string;
    hypothesis: string;
  };
};

// Banner copy from the top of Ion_Setter_Schema.md — surfaced on the
// page header so readers see the lift math context.
export const SCHEMA_PREFACE =
  "One-document consolidation of the 6 invariants × 3 maturity levels. The same schema serves three lenses: Coach (Core Question, L1/L2/L3) for Kenny, Engineer (Stewart Detection) for the pipeline, Executive (Economic Impact) for the VP.";

export const LIFT_MATH =
  "Lift math grounded in Ion YTD baseline: 1,096,975 dials → 9,540 sets → 4,027 sits → 1,258 closes → $29,122/close → $36.6M YTD. +1% absolute close-from-sit = +$1.17M/year; +1% absolute sit rate = +$833k/year; +10% relative set rate = +$4M/year.";

export const INVARIANTS: Invariant[] = [
  {
    id: "intro",
    number: 1,
    title: "Intro",
    core_question:
      "What was the customer's reaction or state after the intro — roughly the first 10 seconds?",
    job: "Earn the right to keep talking. Get the customer to lean in instead of brace for a pitch.",
    failure_state:
      'Customer wrote the rep off as "another solar call" before the introduction finished. They\'re either still on the line being polite or already gone. Rehashed leads — the ones who\'ve been called multiple times — bail before they get asked anything.',
    maturity: {
      l1: {
        label: "Mechanical execution",
        body: "Names rep + Ion + lead source cleanly. Steady pace. Reads the standard opener without sounding nervous. Works on warm leads who picked up expecting the call; loses rehashed leads because there's no move for \"not interested\" — no attempted movement, accepts it, and ends the call.",
      },
      l2: {
        label: "Adaptive execution",
        body: 'Reads the customer in the first three seconds and adjusts. On a rehashed lead, the rep attempts to overcome the objection by naming what the customer is already thinking — *"I know you\'ve probably gotten a few of these calls — I\'ll keep it quick."* (Kenny — how do you want this handled?)',
      },
      l3: {
        label: "Advanced salesmanship",
        descriptor: "pattern interruption",
        body: 'Mirror a word, then a bridge to the bill pain in one breath using the same mirrored word or a value add. Customer: *"I\'m not **interested**."* Rep: *"You\'re right, solar is not very **interesting**. But I bet you\'re **interested** in lowering your monthly utility bill with nothing out of pocket."*',
      },
    },
    stewart_detection:
      "Rep self-identification phrase + Ion mention + lead-source reference within first 30 seconds + rep pace within ±20% of customer + (L3) customer-language mirroring + bridge phrase to bill pain.",
    economic_impact: {
      primary_kpi: "Call completion rate (customer stays past first minute).",
      secondary_kpi: "Set rate on rehashed leads.",
      hypothesis:
        "Most rehashed-lead dial time gets wasted on customers who hang up before the rep has earned the right to ask anything. The L3 pattern interrupt recovers a meaningful slice of those calls — same lead pool, same dial volume, more conversations that have a chance to become sets.",
    },
  },
  {
    id: "anchor",
    number: 2,
    title: "Anchor",
    core_question:
      "What pain/excitement are we anchoring this conversation around — preferably multiple anchors?",
    job: "Capture two anchors — the customer's utility bill AND whatever has them interested in solar. Pain on one side, excitement on the other; both become the frames the rest of the call references back to. The script asks 'what has you interested in solar' for a reason. For a smaller % of customers the excitement is the bigger anchor than the bill swap — don't stop at the bill and assume that's everything.",
    failure_state:
      "Bill becomes a checklist data point instead of leverage. The 'what interested you in solar' answer gets captured once and never referenced again — reps gloss over it and move on. Customer feels processed, not heard. Reframe opportunities downstream collapse because there's no anchor to point back to. Ion corpus: 0 of 332 calls flipped the bill.",
    maturity: {
      l1: {
        label: "Mechanical execution",
        body: 'Captures the dollar amount of the customer\'s monthly utility bill. Asks the script question — "what has you interested in solar" — and notes the answer. Acknowledges the bill back — *"$388, okay, that\'s significant."*',
      },
      l2: {
        label: "Adaptive execution",
        body: 'Amplifies both anchors. Bill side — pain amplification, restates in customer-relatable terms — *"$388 a month — that\'s not a power bill, that\'s a car payment going to the utility."* Excitement side — digs into the why-solar answer with one follow-up that lets the customer vent or get excited.',
      },
      l3: {
        label: "Advanced salesmanship",
        body: 'Anchors get reused throughout the call as the most important reference points — bill comes back every time the conversation drifts; excitement comes back every time it\'s relevant. Three L3 moves layered on top of L2\'s amplification. First, validation — name the pain back AND affirm the customer\'s judgment for considering this: *"Wow — $388 a month, that alone is a reason to be looking at solar. You\'re smart to really consider this. That\'s a car payment going somewhere you can\'t get back."* Second, bill-flip — converts monthly to annual, names what they\'re NOT getting (equity), contrasts with what solar IS: *"$388 a month is $4,656 a year going to the utility for power that doesn\'t build any equity, versus a solar payment that\'d be lower and lock your rate."* Third, excitement-reinforcement — names the why-solar answer back multiple times and ties it to the appointment ask: *"You said you want to take control of your energy bill — that\'s exactly what Tuesday\'s call shows you with your specific numbers."* (Kenny — are these the three L3 moves you\'d want, and is the validation phrasing right?)',
      },
    },
    stewart_detection:
      "Bill amount captured in transcript + 'what interested you in solar' question asked + customer answer captured + acknowledgment phrase within 3 turns + (L2) customer-life vocabulary tie-back + follow-up on the excitement answer + (L3) bill referenced ≥2 times across the call + excitement referenced ≥2 times across the call + validation phrasing + annual-conversion OR equity-language flip + excitement tied to the appointment ask.",
    economic_impact: {
      primary_kpi: "Set rate.",
      secondary_kpi: "Sit rate (the bill pain carries from setter call into appointment).",
      hypothesis:
        "Reps who transform the bill from a qualifying datapoint into the call's central villain create urgency that survives objection handling and carries into the appointment. The floor currently runs 0 of 332 bill-flips — installing the L3 move across the 47 setters is the single largest-upside behavior change available. +10% relative set rate = +$4M/year.",
    },
  },
  {
    id: "match",
    number: 3,
    title: "Match",
    core_question: "Is the rep leading the conversation, or being led by it?",
    job: "Be a real person AND keep the call on the rails. Customer feels heard but the call still moves toward an appointment.",
    failure_state:
      'Rep is friendly but the customer is running the call — asking random questions, drifting off-topic, eventually saying "I\'ll think about it" without anything getting structured. Or: rep is keeping the call on track but the customer feels rushed, gives short answers, doesn\'t open up. Both look productive in the moment, both lose the appointment.',
    maturity: {
      l1: {
        label: "Mechanical execution",
        body: 'Even pace, even tone. One question at a time. If the customer goes off-topic, loops politely back — *"Great question — let me make a note for the designer. Can I ask about [next thing]?"*',
      },
      l2: {
        label: "Adaptive execution",
        body: "Reads the customer and matches their energy. Slow customer → slow down. Rushed customer → compress. Anxious customer → calmer. Stays in control of the call while letting the customer's energy shape delivery.",
      },
      l3: {
        label: "Advanced salesmanship",
        body: "The customer doesn't realize they're being led. The rep sounds like a knowledgeable neighbor having a consultative conversation — calm, certain, not needy. Pivots between push, pause, redirect without breaking flow.",
      },
    },
    stewart_detection:
      "Rep pace within ±20% of customer over rolling 60s + register shift on emotional-state changes + no rep monologue >45s before customer turn + (L3) clarifying question without breaking flow.",
    economic_impact: {
      primary_kpi: "Sit rate.",
      secondary_kpi: "Close-from-sit (the customer's trust in the rep carries to trust in the closer).",
      hypothesis:
        'Customers who hung up the setter call thinking "that person actually heard me" show up to the designer appointment. Customers who hung up thinking "that was a solar pitch" don\'t. Ion floor sit rate is 42%; bottom-quartile reps run 22-30%, top-quartile 53-58%. Closing the rapport+control gap across the bottom half of the floor is worth $1-2M/year.',
    },
  },
  {
    id: "reframe",
    number: 4,
    title: "Reframe",
    core_question:
      "How do we use resistance to create momentum instead of losing it?",
    job: "Use customer objections as bridges to appointment value instead of fighting them. The highest-leverage move on the floor lives here.",
    failure_state:
      "Objections become dead-ends. Rep defends solar instead of redirecting. Customer disengages. Ion-corpus floor pattern: objection inversion executed 0 times across 332 calls — the entire L3 reframe layer is currently absent.",
    maturity: {
      l1: {
        label: "Mechanical execution",
        body: "Acknowledges the objection without arguing. Asks one follow-up question to surface the real concern.",
      },
      l2: {
        label: "Adaptive execution",
        body: 'Objection Framing — acknowledges, restates in customer\'s words, bridges to appointment value — *"That\'s fair — the only way to know if it\'s expensive in YOUR case is to see what the math looks like on your bill."*',
      },
      l3: {
        label: "Advanced salesmanship",
        body: 'Objection Inversion — uses the customer\'s own framing against the STATUS QUO, not against solar — *"What you can\'t afford is keeping your current bill. That\'s exactly why we\'re talking."*',
      },
    },
    stewart_detection:
      "Rep didn't interrupt the customer's objection + acknowledgment phrase + restatement in customer-language + bridge to appointment ask within 3 turns + (L3) status-quo-framing inversion phrasing.",
    economic_impact: {
      primary_kpi: "Set rate (objection-handled calls become bookings instead of dead-ends).",
      secondary_kpi:
        "Per-objection-type conversion across the 10 canonical types (Price/Cost, Scheduling, Roof/Property, Bill Access, Credit, Not Ready, Info Preference, Existing Solar, Eligibility, Spouse).",
      hypothesis:
        "Objection inversion is the highest-leverage absent move on the Ion floor (0 of 332 executions). Each canonical objection type that gets a working L3 inversion word track lifts that objection's conversion rate by single-digit-to-low-double-digit percentage points. Compounded across all 10 objection types, this is the largest revenue-recovery layer in the schema.",
    },
  },
  {
    id: "qualifier",
    number: 5,
    title: "Qualified",
    core_question:
      "How well is this customer a qualified match for solar — will the appointment hold to a showed appointment, and is there strong reasoning to convert to a buying customer?",
    job: "Capture the structural gates (title, co-owner, credit threshold, tax incentive, military, decision-maker, timing) without burning trust — AND include co-decision-makers ON the appointment as participants, not obstacles.",
    failure_state:
      'Co-owner kills the deal at signing because nobody asked. Credit fuzz-answer ("around there") logged as qualified when it isn\'t. Spouse-mentioned appointments scheduled solo and convert at a fraction of paired rate. Closer arrives to a structurally broken setup.',
    maturity: {
      l1: {
        label: "Mechanical execution",
        body: "Walks the Verify checklist in order — address, single-family, homeowner, anyone-else-on-title, utility, bill, roof type / age, prior design. Then tax-incentive (pays income taxes?) + credit threshold (650+) + military qualifier. Captures clean binary answers.",
      },
      l2: {
        label: "Adaptive execution",
        body: 'Decision-Maker Inclusion — when customer surfaces a spouse / adult child / partner, immediately includes them on the appointment as a participant — *"Absolutely, let\'s get the appointment set so he can be there too."* Expands shallow "what interested you in solar?" answers with one follow-up.',
      },
      l3: {
        label: "Advanced salesmanship",
        body: 'Vetoed-DM Reframe — when a previously-resistant decision-maker surfaces ("grandson said no," "husband already declined"), invites them to the appointment instead of arguing against them — *"That makes sense — he\'s protective of you. Would he get on the 20-minute call so he can see what we\'re showing you?"*',
      },
    },
    stewart_detection:
      "Title question + co-owner follow-up after title confirmation + credit threshold (650+) binary captured + tax incentive captured + military captured + spouse-mention → spouse-on-appointment confirmation in same call.",
    economic_impact: {
      primary_kpi:
        "Sit rate (paired-spouse appointments show up at meaningfully higher rates than solo appointments).",
      secondary_kpi:
        "Close-from-sit (closer arrives to a real qualified prospect, not a structural mismatch).",
      hypothesis:
        "Spouse-mention-without-inclusion is a recurring sit-rate killer. Floor data shows ~80 spouse references in the corpus with 3 booked — closing the inclusion gap directly lifts sit AND close. +1% close-from-sit = +$1.17M/year; co-owner-follow-up adherence further protects close rate by eliminating signing-table veto risk.",
    },
  },
  {
    id: "button_up",
    number: 6,
    title: "Button-Up",
    core_question:
      "How well did the rep rephrase the button up — will this customer hold to a sit, and convert to a sale?",
    job: "Convert the appointment into a real COMMITMENT, not just a calendar slot. Surface real intent before scheduling.",
    failure_state:
      'Soft appointment that no-shows. Customer "says yes" without committing. Closer arrives to an empty calendar. Floor capacity wasted. Open-ended "when\'s good for you?" is a known Ion-floor losing pattern.',
    maturity: {
      l1: {
        label: "Mechanical execution",
        body: "Specifies day + time (not open-ended). Sets expectations — hour blocked off, not driving, at a computer. Confirms text follow-up with appointment details after the call ends.",
      },
      l2: {
        label: "Adaptive execution",
        body: 'Tieback to the customer\'s specific bill amount + concern + confirms all decision-makers will be present + personalized details in the post-call text — *"Tuesday at 4, your husband will be home, the designer walks you both through your specific numbers on that $388 bill. I\'ll text you a confirmation."*',
      },
      l3: {
        label: "Advanced salesmanship",
        body: 'Commitment-framing diagnostic BEFORE scheduling — *"If the math shows your bill drops from $388 to under $200 with no money down, are you the kind of person who\'d be ready to move forward, or would you want time to think it over?"* Surfaces real intent before the calendar is touched.',
      },
    },
    stewart_detection:
      'Specific day + time named by rep (not customer) + "is that fair?" handshake phrase + spouse confirmation if mentioned earlier + (L3) commitment-framing if-then phrasing before slot confirmation + text-follow-up confirmation.',
    economic_impact: {
      primary_kpi: "Show rate (committed appointments show up).",
      secondary_kpi:
        "Sit rate (the appointment that holds becomes the appointment that runs).",
      hypothesis:
        'Committed appointments — where the rep surfaced real intent via the L3 commitment-framing diagnostic before scheduling — show up at meaningfully higher rates than soft appointments. The "is that fair?" handshake mechanic is the single highest-leverage Button-Up drill; closing the gap between rep show-rate variance directly recovers wasted designer dispatch capacity. Each 1% show-rate lift compounds with the sit-rate lift = ~$1M/year combined.',
    },
  },
];

// Helper for the renderer — splits a body string on `*"…"*` markers
// and returns alternating prose/quote segments so the InvariantSection
// can render quotes as inline blockquotes with distinct styling.
export type BodySegment =
  | { kind: "prose"; text: string }
  | { kind: "quote"; text: string };

export function parseBody(body: string): BodySegment[] {
  const segments: BodySegment[] = [];
  // Match the markdown italic-quote pattern: *"…"*  (the schema files
  // only use this pattern for word-track examples — never for general
  // emphasis. If that ever changes, this parser needs to get smarter.)
  const re = /\*"([^"]+)"\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        kind: "prose",
        text: body.slice(lastIndex, match.index),
      });
    }
    segments.push({ kind: "quote", text: match[1] });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < body.length) {
    segments.push({ kind: "prose", text: body.slice(lastIndex) });
  }
  return segments;
}
