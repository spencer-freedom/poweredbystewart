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
    hook: "A cold open he steadied, a reason the customer gave three times, peer proof from his own son \u2014 and one \u201cnot this week\u201d that ended it with zero angles.",
    win: { ts: "03:32", title: "The customer sold himself: his son\u2019s panels, his son\u2019s tiny bill, and \u201cwhy not.\u201d", why: "Peer proof and a stated reason, both on the tape by 3:32. This is a hot lead by any floor\u2019s definition." },
    miss: { ts: "09:29", title: "\u201cIt\u2019s not gonna happen this week\u201d \u2192 \u201cCompletely understand.\u201d No appointment.", why: "One timing objection, no angle tried, no callback time, and the call ended. The reason the customer gave at 3:10 was never used to hold the door open.", kind: "objection", floor: "On this floor, an objection answered with no angle at all sets 7% of the time. One angle, 46%. Two, 61%.",
      text: "Totally understand, and that\u2019s exactly why I don\u2019t want this one to slip \u2014 you told me the bills are hitting while your wife\u2019s not working. It\u2019s a twenty-minute phone call, nothing to drive to. Would a Saturday morning or a weeknight after six be easier?" },
  },
};
export const SHOWCASE_ORDER = ["10000532255", "SESSION2_e891f024", "30000139035"];
