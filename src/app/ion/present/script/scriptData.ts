// Ion Solar — v2 Master Paid Lead Setting Script (through Rebuttals),
// extracted verbatim from Kenny's .docx. red = Ion's own red coaching
// notes; bold = bold in the doc; head = a section header. The internal
// scheduling/checklist appendix is intentionally omitted.
export type ScriptRun = { t: string; red?: boolean; bold?: boolean };
export type ScriptPara = { head?: boolean; runs: ScriptRun[] };
export const SCRIPT_PARAS: ScriptPara[] = [
{
"head": true,
"runs": [
{
"t": "SETTING SCRIPT",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Hey ",
"red": false,
"bold": true
},
{
"t": "(CUSTOMER NAME)?, ",
"red": false,
"bold": false
},
{
"t": "(PAUSE for response)",
"red": true,
"bold": false
},
{
"t": " ",
"red": false,
"bold": false
},
{
"t": "Hey this is ",
"red": false,
"bold": true
},
{
"t": "(YOUR NAME)",
"red": false,
"bold": false
},
{
"t": " with ION. I got a request that you're looking at solar for your home. How are you doing today?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Glad to hear it. Well, I'll keep this call really short for you. I work directly with our design team to create the solar design for your home. I have a couple of questions real quick. The first question is about your address...",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "I've got your address here as (___), is that correct?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(If no address)",
"red": true,
"bold": false
},
{
"t": " ",
"red": false,
"bold": false
},
{
"t": "Can I start by grabbing your home address? (PULL UP ON GOOGLE MAPS ASAP!!!)",
"red": true,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Awesome, that's a really busy area for us! Ok, I'm going to pull up your address real quick on google maps to check out your roof. While I'm doing that, I'm just curious... What has you interested in solar?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "I have you down as the property owner, is there anyone else? ",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(Yes) ",
"red": false,
"bold": false
},
{
"t": "Ok perfect, what's their name? ",
"red": false,
"bold": true
},
{
"t": "(Make sure you schedule a time where both parties can be there unless they refuse to both meet.)",
"red": true,
"bold": false
}
]
},
{
"head": false,
"runs": [
{
"t": "(No) ",
"red": false,
"bold": false
},
{
"t": "No problem. ",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(PULL up the address to see the home)",
"red": true,
"bold": false
}
]
},
{
"head": false,
"runs": [
{
"t": "Let's see here... I'm looking at your home on google maps right now. Looks like a single family home. Is that right?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(Positive) ",
"red": false,
"bold": false
},
{
"t": "(",
"red": false,
"bold": true
},
{
"t": "Make a comment about the area, the homes beauty, or how ideal the home is because it gets blasted by sun ALL day",
"red": true,
"bold": false
},
{
"t": ") ",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(Negative) ",
"red": false,
"bold": false
},
{
"t": "(Ask questions about whatever makes this home not qualify and see if we can workshop a solution)",
"red": true,
"bold": false
}
]
},
{
"head": false,
"runs": [
{
"t": "What kind of roof do you have? Asphalt shingle? How old is the roof? (",
"red": false,
"bold": true
},
{
"t": "We cannot install on wood shake, solid concrete, concrete tile, slate, and membrane roofs. If the roof is 20+ years old, ask if they're open to a replacement if it is needed",
"red": true,
"bold": false
},
{
"t": ")",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Ok and what utility company are you with? ",
"red": false,
"bold": true
},
{
"t": "(Use cheat sheet list to make comment about them-COMING SOON)",
"red": true,
"bold": false
}
]
},
{
"head": false,
"runs": [
{
"t": "Do you have an idea on how much you're spending on average each month?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Just so you know, there is a federal tax incentive to go solar. You just need to pay income taxes and a credit score above 650 to qualify for that. Is that the case for you?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(YES) Qualified, move on. ",
"red": true,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(NO) - Check to see if it is a PPA state. If not, this is a DQ unless they want to pay cash for a system or get one without the tax incentive. ",
"red": true,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Are you active duty or retired military?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(YES) Great, we have a military incentive that our energy advisor will go over with you as well!",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(NO) No worries :)",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Now, have you seen a solar design for this home?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(Yes) I guess a question I have for you is... What is most important to you when considering a solar company?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(No) (",
"red": false,
"bold": true
},
{
"t": "Move on",
"red": true,
"bold": false
},
{
"t": ")",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(If they say yes to previous question, validate what they say and add whatever bullet points fit best)",
"red": true,
"bold": true
},
{
"t": " ",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Over 90,000 installs",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Everything is done IN HOUSE",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "US made equipment (Panels Washington / Inverters California)",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Debt free & backed by Blackstone",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Going on 12 years in business",
"red": false,
"bold": true
}
]
},
{
"head": true,
"runs": [
{
"t": "CLOSING",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Ok we are about done here. The way this works from here is we are going to do what's called a sun study on your home. We measure how much sunlight hits your roof over an entire year so we know how much power a panel will produce on different sections of your roof. We don't want to guess how many solar panels you'll need so we do this based upon your energy usage history. The easiest way to get that is by looking at one of your recent energy bills. There is a graph on the bill that shows how many kilowatt hours you use each month. ",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Do you get those bills in the mail or online?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(Mail) ",
"red": false,
"bold": false
},
{
"t": "Perfect, would you rather text or email that to me?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(Online) ",
"red": false,
"bold": false
},
{
"t": "Perfect, would you rather text or email that to me?",
"red": false,
"bold": true
}
]
},
{
"head": true,
"runs": [
{
"t": "APPOINTMENT",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Ok the last thing we need to do is schedule your appointment with our energy advisor. ",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "***DETERMINE IF THIS LEAD IS BEST SUITED FOR IN A HOME VISIT OR PHONE CALL***",
"red": true,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "DOOR APPT",
"red": true,
"bold": false
},
{
"t": ":",
"red": false,
"bold": false
},
{
"t": " It looks like we have a guy in your area DAY and again on DATE. Which day works best for you and (Other owner)?",
"red": false,
"bold": true
},
{
"t": "PHONE APPT",
"red": true,
"bold": false
},
{
"t": ": ",
"red": false,
"bold": false
},
{
"t": "Are there any upcoming appointments we need to schedule around?",
"red": false,
"bold": true
},
{
"t": "(If they have more solar appts, try to schedule us last) ",
"red": true,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "It looks like we can give you a call to review this DAY or on DAY. Which day works best for you?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Do you prefer mornings or afternoons?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "It looks like we've got time ",
"red": false,
"bold": true
},
{
"t": "(offer 2 times and let them pick which is best)",
"red": true,
"bold": false
},
{
"t": " ",
"red": false,
"bold": false
},
{
"t": "tomorrow at ",
"red": false,
"bold": true
},
{
"t": "(Time) ",
"red": false,
"bold": false
},
{
"t": "or the following day at ",
"red": false,
"bold": true
},
{
"t": "(Time). ",
"red": false,
"bold": false
},
{
"t": "Which one works best for you?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(*IF CUSTOMER ASKS: The appointments usually run 30-45 min, they could go longer or shorter depending on how many questions you may have) ",
"red": true,
"bold": false
}
]
},
{
"head": true,
"runs": [
{
"t": "BUTTON UP",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Alright, (",
"red": false,
"bold": true
},
{
"t": "Customer Name",
"red": false,
"bold": false
},
{
"t": " ) I've got you on our schedule for",
"red": false,
"bold": true
},
{
"t": " (Appt. Date and Time).",
"red": false,
"bold": false
},
{
"t": " I blocked off that time for an hour to ensure you don't feel rushed. It just depends on how many questions that you have.  ",
"red": false,
"bold": true
},
{
"t": "(Phone appt)",
"red": true,
"bold": false
},
{
"t": " The only thing we ask for this appointment is that you aren't driving and that you'll be able to sit down to review the design on your computer. Is that fair?",
"red": true,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "We'll give you a call or shoot you a text a couple hours before the appointment to reconfirm your availability.",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Well that's everything today. We're going to get to work on the design for your home.  We have some new cutting edge technology that I really believe will set us apart from everyone else and I can't wait for you to see it!",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "We'll see you at (",
"red": false,
"bold": true
},
{
"t": "Appt. Date and time). ",
"red": false,
"bold": false
},
{
"t": "Okay, bye for now!",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "**(NOTE if the appointment is scheduled for a time before 11AM their time, we confirm the appointment the night before)**",
"red": true,
"bold": false
}
]
},
{
"head": true,
"runs": [
{
"t": "REBUTTALS",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Can you send me the proposal before I meet?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Our policy is that we don't email out the proposals. The biggest reason is our proposals require explanation otherwise they can be confusing. Our consultants will explain everything so it makes sense.",
"red": true,
"bold": true
},
{
"t": " (Stick to your guns on this. No one will purchase if we send them the design beforehand)",
"red": true,
"bold": false
}
]
},
{
"head": false,
"runs": [
{
"t": "I changed my mind...",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Have you had a chance to look at a design for your home yet?",
"red": true,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(Yes)",
"red": true,
"bold": false
},
{
"t": " Go to \"I already saw a design\"",
"red": true,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(No)",
"red": true,
"bold": false
},
{
"t": " I recommend you take a look at it (Customer Name). It doesn't cost anything to look at these and solar is like a glove. It either fits or it doesn't. Either way, it could save you tens of thousands. You should at least take a look and then you will know for sure if solar makes sense for your home. ",
"red": true,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "I already saw a design...",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "No worries, it's always best to get a couple looks so you have something to compare against. We offer these for free so I recommend we put together one for you. What did you think about the design you already saw?",
"red": true,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "I signed up with someone...",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "No worries, I'd recommend getting a design from us to compare against what you have. What you'll find is either you made a great decision or there is a better deal out there. Either way, it's always a good idea to get a couple looks for something like this. ",
"red": true,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "I was told my home doesn't work for solar",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Do you know why it was disqualified? ",
"red": true,
"bold": true
},
{
"t": "(See if we would DQ for same reason)",
"red": true,
"bold": false
}
]
}
];
