// The three showcase calls. Each has a hook, a moment the rep got right, and
// the moment the one-on-one is about — with the line the rep could have said,
// rendered in his own voice. Suggested rephrases: not things they said.
export type Showcase = {
  level: 1 | 2 | 3;
  levelTitle: string;
  hook: string;
  win: { ts: string; title: string; why: string };
  // clip: the window to play for the moment, in seconds; default is ts-4 to ts+26.
  miss: { ts: string; title: string; why: string; text: string; floor: string; kind: "objection" | "moment"; clip?: { start: number; end: number } };
};
export const SHOWCASE: Record<string, Showcase> = {
  "10000532255": {
    level: 1,
    levelTitle: "Here\u2019s what happened",
    hook: "Every section of the script, a no beaten with two angles, booked with the bill — and the one number he never used.",
    win: { ts: "05:35", title: "\u201cMaybe not tomorrow\u201d \u2192 \u201cWhat about Friday?\u201d \u2192 \u201c6PM? Perfect.\u201d", why: "Two angles on a timing objection, and the script went on to the button-up. On this floor a second angle takes the set rate from 46% to 61%." },
    miss: { ts: "02:16", title: "$180 a month, captured at 2:16, and then a tangent about the power meter.", why: "The biggest anchor on the call was filed, not used. Ion's own playbook calls this the bill flip, and the floor did it on 2 of 184 calls where the bill was captured.", kind: "moment", floor: "Across 298 calls the bill was captured 184 times and turned into the reason to act twice.",
      text: "A hundred and eighty a month \u2014 so you\u2019re handing the power company over two grand a year for nothing you own. That\u2019s the number the specialist builds the design around, so let\u2019s get it in front of you." },
  },
  "SESSION2_e891f024": {
    level: 2,
    levelTitle: "Here\u2019s what could have happened",
    hook: "Three objections, all three got past, booked with the bill \u2014 and three minutes in the middle where the setter started closing.",
    win: { ts: "10:33", title: "\u201cI don\u2019t know if I\u2019m comfortable with it\u201d \u2192 a phone appointment instead of a visit.", why: "A trust objection at the close, answered with an alternative rather than an argument. Offering an alternative sets 70% of the time on this floor; giving a reason, 45%." },
    miss: { ts: "03:03", clip: { start: 172, end: 244 }, title: "Three minutes of bill-swap mechanics, until the customer said \u201cNo. I\u2019m not following you.\u201d", why: "Closer-tier content, volunteered unprompted. It confused instead of reassured and it gave away the reason to take the appointment. The playbook\u2019s escape hatch is one sentence.", kind: "moment", floor: "Setter scope creep is the most common cherry-pick classification on the floor after the reason being filed instead of used.",
      text: "Honestly, that\u2019s exactly what the specialist walks you through, with your actual bill in front of you \u2014 it makes way more sense with your numbers than with me describing it. Let me grab the last couple of quick questions so they can build it for you." },
  },
  "30000139035": {
    level: 3,
    levelTitle: "Here\u2019s what Stewart knows that isn\u2019t in this call",
    hook: "A cold open he steadied, a reason the customer gave three times, peer proof from his own son \u2014 and then two asks that ended with no commitment: the bill, then the time.",
    win: { ts: "03:32", title: "The customer sold himself: his son\u2019s panels, his son\u2019s tiny bill, and \u201cwhy not.\u201d", why: "Peer proof and a stated reason, both on the tape by 3:32. He answered every question after that and never once said no to solar. This is a hot lead by any floor\u2019s definition." },
    miss: { ts: "09:29", clip: { start: 522, end: 600 }, kind: "objection",
      title: "He asked for the bill and took \u201cI\u2019ll look at it.\u201d He asked for a time and took \u201cnot this week.\u201d Two open loops, no commitment on either.",
      why: "Everything built over nine minutes leaked at the close. The bill left without a when. The appointment left without a when. The customer never said no \u2014 he said not this week \u2014 and the call ended with \u201conce that comes through, I\u2019ll reach out again,\u201d which is nobody\u2019s job.",
      floor: "On this floor, a set with the bill in hand sets 96% of the time; with the bill promised later, 54%. And an objection answered with no angle at all sets 7%; one angle, 46%; two, 61%.",
      text: "Perfect \u2014 do me a favor and snap that bar graph tonight so it\u2019s in my inbox by tomorrow; I\u2019ll text you my number right now so it\u2019s easy. And since the specialist\u2019s in your area this week, let\u2019s hold a twenty-minute phone slot \u2014 Saturday morning or a weeknight after six \u2014 and if the usage says it\u2019s not worth your time, we cancel it and you\u2019ve lost nothing." },
  },
};
export const SHOWCASE_ORDER = ["10000532255", "SESSION2_e891f024", "30000139035"];
