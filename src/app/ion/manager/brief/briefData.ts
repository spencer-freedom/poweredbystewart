// The four calls on the manager's Daily Morning View. All real — the
// three from The Miss (Meg, Joel, Carter) plus Jake's hero call. Copy is
// distilled from each call's Stewart manager brief
// (public/ion/calls/<id>-manager-brief.json); timestamps are the brief's
// own. Clip windows bracket the quoted moment — tune by ear.

export type BriefCall = {
  rep: string;
  callId: string;
  minutes: number;
  flag: "recover" | "fragile" | "stalled";
  headline: string;
  why: string;
  ts: string;
  start: number;
  end: number;
};

export const BRIEF_CALLS: BriefCall[] = [
  {
    rep: "Jake",
    callId: "SESSION10_eb080f7c",
    minutes: 12,
    flag: "recover",
    headline: "Larry was qualified. Jake lost him.",
    why: "Larry's already had trees cut down to make solar work. The roof objection at 06:19 was a roofing lead — Jake told him to call back when the roof's done. That's deferred pipeline, not a DQ.",
    ts: "06:34",
    start: 375,
    end: 410,
  },
  {
    rep: "Meg",
    callId: "SESSION20_2b61f758",
    minutes: 21,
    flag: "fragile",
    headline: "Hostile to booked in 21 minutes. Sit is fragile.",
    why: "Real work — she held her composure the whole call. But co-title holder Andy was named at 01:29 and excluded at 11:16, and the appointment is conditioned on Meg being on the line. The closer needs both fixed before contact.",
    ts: "01:29",
    start: 84,
    end: 98,
  },
  {
    rep: "Joel",
    callId: "10000160568",
    minutes: 6,
    flag: "fragile",
    headline: "Booked — with the biggest concern still open.",
    why: "Robert said “I figured it'd be expensive” at 00:44 and again at 05:19. Never flipped. His wife is on the title with the qualifying credit and wasn't confirmed for the sit.",
    ts: "05:19",
    start: 312,
    end: 332,
  },
  {
    rep: "Carter",
    callId: "20000555055",
    minutes: 5,
    flag: "stalled",
    headline: "No appointment. Lorenzo wanted in person.",
    why: "He said it at 04:24 and the call ended there. Before that, Lorenzo gave up a $120 bill at 00:42 and Carter filed it — “pretty expensive for you” and straight to the address. Two minutes in the one-on-one.",
    ts: "04:24",
    start: 258,
    end: 272,
  },
];
