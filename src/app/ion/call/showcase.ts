// The three showcase calls. Each has a hook, a moment the rep got right, and
// the moment the one-on-one is about — with the line the rep could have said,
// rendered in his own voice. Suggested rephrases: not things they said.
export type Showcase = {
  level: 1 | 2 | 3;
  // The rep whose cloned voice reads the synthetic lines; the middleware only
  // lets the voice route pair a line with this voice.
  voice: string;
  levelTitle: string;
  hook: string;
  // Hand-written, in a coach's voice. Overrides the read's generated prose.
  summary: string;
  focus: { title: string; why: string };
  win: { ts: string; title: string; why: string };
  // Each coaching part: the moment, what was said (explicit, or pulled from the
  // read by ts), the floor's numbers, and the line the rep could have said.
  // clip: the window to play, in seconds; default is ts-4 to ts+26.
  misses: Miss[];
};
export type Miss = {
  ts: string; title: string; why: string; text: string; floor: string; kind: "objection" | "moment";
  clip?: { start: number; end: number };
  said?: { who: "rep" | "customer"; line: string }[];
};
export const SHOWCASE: Record<string, Showcase> = {
  "10000532255": {
    voice: "Carter",
    level: 1,
    levelTitle: "Here\u2019s what happened",
    hook: "Every section of the script, a no beaten with two angles, booked with the bill — and the one number he never used.",
    summary: "Booked with the bill in hand in seven minutes. On paper it\u2019s clean \u2014 verify items, qualifiers, bill collected, time locked. But listen to it: flat. The $180 bill lands, and Carter never turns it into pain or urgency. He ran the script like a checklist instead of building toward a close.",
    focus: { title: "Bill captured but never flipped", why: "The biggest anchor on the call was a monthly bill number, and it got filed instead of used. He had it in his hand at 2:16 and never turned it into a reason to show up \u2014 then pivoted straight into a tangent about the power meter. The money was right there and he walked past it." },
    win: { ts: "05:35", title: "\u201cMaybe not tomorrow\u201d \u2192 \u201cWhat about Friday?\u201d \u2192 \u201c6PM? Perfect.\u201d", why: "Two angles on a timing objection, and the script went on to the button-up. On this floor a second angle takes the set rate from 46% to 61%." },
    misses: [{ ts: "02:16", title: "$180 a month, captured at 2:16, and then a tangent about the power meter.", why: "The biggest anchor on the call was filed, not used. Ion's own playbook calls this the bill flip, and the floor did it on 2 of 184 calls where the bill was captured.", kind: "moment", floor: "Across 298 calls the bill was captured 184 times and turned into the reason to act twice.",
      text: "A hundred and eighty a month \u2014 so you\u2019re handing the power company over two grand a year for nothing you own. That\u2019s the number the specialist builds the design around, so let\u2019s get it in front of you." }],
  },
  "SESSION2_e891f024": {
    voice: "Meg",
    level: 2,
    levelTitle: "Here\u2019s what could have happened",
    hook: "Three objections, all three got past, booked with the bill \u2014 and three minutes in the middle where the setter started closing.",
    summary: "Booked, bill in hand, three objections and she got past all three. So why does the middle of this call feel like a slog? Because around the three-minute mark Meg stopped setting and started selling \u2014 three straight minutes of how the bill swap works \u2014 until the customer said, flat out, \u201cI\u2019m not following you.\u201d She recovered. The bill photo landed, the time got set. But the recovery was work she made for herself.",
    focus: { title: "The setter started closing", why: "A setter\u2019s job is to get the bill and the time. The program mechanics are the specialist\u2019s job, and the escape hatch is one sentence. Three minutes of mechanics didn\u2019t reassure the customer; they confused him, and they gave away the reason to take the appointment." },
    win: { ts: "10:33", title: "\u201cI don\u2019t know if I\u2019m comfortable with it\u201d \u2192 a phone appointment instead of a visit.", why: "A trust objection at the close, answered with an alternative rather than an argument. Offering an alternative sets 70% of the time on this floor; giving a reason, 45%." },
    misses: [{ ts: "03:03", clip: { start: 172, end: 244 }, title: "Three minutes of bill-swap mechanics, until the customer said \u201cNo. I\u2019m not following you.\u201d", why: "Closer-tier content, volunteered unprompted. It confused instead of reassured and it gave away the reason to take the appointment. The playbook\u2019s escape hatch is one sentence.", kind: "moment", floor: "A setter starting to close is the second most common thing Stewart flags on this floor, after a reason filed instead of used.",
      text: "Honestly, that\u2019s exactly what the specialist walks you through, with your actual bill in front of you \u2014 it makes way more sense with your numbers than with me describing it. Let me grab the last couple of quick questions so they can build it for you." }],
  },
  "30000139035": {
    voice: "Joel",
    level: 3,
    levelTitle: "Here\u2019s what Stewart knows that isn\u2019t in this call",
    hook: "A cold open he steadied, a reason the customer gave three times, peer proof from his own son \u2014 and then two asks that ended with no commitment: the bill, then the time.",
    summary: "Nine minutes of good work. The customer opened cold, questioning the lead, and Joel steadied him. Then the customer handed him everything: his wife\u2019s medical bills as the reason, his son\u2019s panels and tiny bill as the proof, and a \u201cwhy not.\u201d He never said no to solar. And the call still ended with nothing \u2014 no bill, no time \u2014 because both asks got a soft answer and Joel took it.",
    focus: { title: "Two asks, no commitment", why: "The bill and the time both died on the first no. Neither no was a real no. One more angle on each, and this is a set with the bill in hand." },
    win: { ts: "03:32", title: "The customer sold himself: his son\u2019s panels, his son\u2019s tiny bill, and \u201cwhy not.\u201d", why: "Peer proof and a stated reason, both on the tape by 3:32. He answered every question after that and never once said no to solar. This is a hot lead by any floor\u2019s definition." },
    misses: [
      { ts: "08:49", clip: { start: 522, end: 562 }, kind: "moment",
        title: "Part 1 \u00b7 The bill. The customer said \u201cI\u2019ll go look at the stupid bill and email it.\u201d That was a no with a smile \u2014 and Joel made no second attempt.",
        why: "The bill is the design; without it there is no appointment worth sitting. \u201cI\u2019ll look at it later\u201d is an objection, and it won on the first try. One more angle keeps the customer on the task while he\u2019s still on the phone: send the email now, have him confirm it landed, then walk him to where the bill actually is \u2014 the inbox, the online account \u2014 and get the bar graph sent back before the call ends.",
        said: [
          { who: "customer", line: "If you want to send me an email to my address, I could try to get myself to look at the stupid bill, and I could send it back to you." },
          { who: "rep", line: "Okay. Perfect. So I\u2019ll send you that email right now. And if you just send in the photo, all we need to see is just the bar graph with the usage." },
        ],
        floor: "On this floor, the bill in hand on the call sets 96% of the time. Promised later, 54%. Never asked for, 28%. And against any no: one angle sets 46%, two sets 61%.",
        text: "Perfect \u2014 I\u2019m sending that email right now, so you should see it pop up in a second. Do you know where that bill is? If it\u2019s in your inbox or your online account, pull it up while I\u2019ve got you and we\u2019ll get the bar graph sent back right now \u2014 then the specialist can build it today instead of next week." },
      { ts: "09:29", clip: { start: 560, end: 600 }, kind: "objection",
        title: "Part 2 \u00b7 The time. \u201cNot this week\u201d \u2192 \u201cI completely understand.\u201d Zero angles, no slot held.",
        why: "The customer never said no \u2014 he said not this week \u2014 and the rep tried zero angles. On this floor, zero angles sets 7% of the time. One angle, 46%. Two, 61%. Every attempt he didn\u2019t make was odds left on the table, and the call ended with \u201conce that comes through, I\u2019ll reach out again,\u201d which is nobody\u2019s job.",
        floor: "Angles tried against a no, and the set rate that follows: none 7%, one 46%, two 61%, three or more 73%.",
        text: "Totally understand \u2014 and that\u2019s exactly why I\u2019d rather hold a spot than chase you: the specialist\u2019s in your area this week. Saturday morning or a weeknight after six? And if the usage says it\u2019s not worth your time, we cancel it and you\u2019ve lost nothing." },
    ],
  },
};
export const SHOWCASE_ORDER = ["10000532255", "SESSION2_e891f024", "30000139035"];
