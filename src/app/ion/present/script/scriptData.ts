// Ion Solar — v1 Master Paid Lead Setting Script (through Rebuttals),
// extracted verbatim from Kenny's .docx (the version the floor runs).
// red = Ion's own red coaching notes; bold = bold; head = section header.
// NOTE: v1 has NO 'what interested you in solar' question — that was
// added in v2. The bill anchor ('how much you're spending on average')
// IS present. Internal scheduling/checklist appendix omitted.
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
"t": " with Ion Solar. I got a request that you're looking at solar for your home. How are you doing today?",
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
"t": "DISCOVERY",
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
"t": "Can I start by grabbing your home address?",
"red": true,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Okay, and is this a single-family home?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Are you the homeowner? ",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Is there anyone else on the title?",
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
"t": "Would they like to be involved with this?",
"red": false,
"bold": true
},
{
"t": " (If yes, make sure you schedule a time where both parties can be there.)",
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
"t": "I just pulled up your home on google maps.",
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
"t": "Good looking home... That's exactly what we are looking for. ",
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
"t": "It looks like you have some trees shading your home. Are all of those still there?",
"red": false,
"bold": true
},
{
"t": " ",
"red": false,
"bold": false
},
{
"t": "(If they are, ask them if they're open to trimming them back and/or cutting them down)",
"red": true,
"bold": false
}
]
},
{
"head": false,
"runs": [
{
"t": "Just a few more questions here and we will be set...",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "What utility company are you with?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Do you know how much you're spending on average each month?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Have you seen a solar design for this home yet? ",
"red": false,
"bold": true
},
{
"t": "(Indicate this in notes)",
"red": true,
"bold": false
}
]
},
{
"head": false,
"runs": [
{
"t": "(Yes)",
"red": false,
"bold": false
},
{
"t": " Oh perfect, all I need to finish this up for you is your energy usage. Do you get your bills online or in the mail? ",
"red": false,
"bold": true
},
{
"t": "(",
"red": true,
"bold": false
},
{
"t": "Grab PDF",
"red": true,
"bold": true
},
{
"t": " of bill and ",
"red": true,
"bold": false
},
{
"t": "SKIP ahead to setting the APPOINTMENT",
"red": true,
"bold": true
},
{
"t": ")",
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
"t": "Okay, no problem. ",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
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
"t": "And just so you know, the government does help out with the cost of this. The only thing you need to qualify is that you pay income taxes. Do you pay income tax?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(Yes)",
"red": false,
"bold": false
},
{
"t": " Awesome, you qualify for the government incentive. ",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(No)",
"red": false,
"bold": false
},
{
"t": " Okay no problem. That means the government won't be helping with the solar system cost. Do you have money set aside for something like this? ",
"red": false,
"bold": true
},
{
"t": "(No) ",
"red": true,
"bold": false
},
{
"t": "Are you open to solar if it costs more than you spend for power right now? ",
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
"t": " Ok, sounds great. ",
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
"t": " Ok, it doesn't sound like solar would be a good fit for you at this time. Thank you for your time and I hope you have a wonderful day!",
"red": true,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "Do you have a credit score above 650?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(",
"red": false,
"bold": true
},
{
"t": "Yes",
"red": false,
"bold": false
},
{
"t": ") Ok, perfect. ",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(",
"red": false,
"bold": true
},
{
"t": "No",
"red": false,
"bold": false
},
{
"t": ") Does anyone on the title have a score above 650?",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(",
"red": false,
"bold": true
},
{
"t": "Yes",
"red": false,
"bold": false
},
{
"t": ") Ok, perfect. ",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "(",
"red": true,
"bold": true
},
{
"t": "No",
"red": true,
"bold": false
},
{
"t": ")",
"red": true,
"bold": true
},
{
"t": " ",
"red": false,
"bold": true
},
{
"t": "We wouldn't be able to provide financing. Do you have cash set aside to buy solar outright?",
"red": true,
"bold": true
},
{
"t": " (If they don't, Disqualify the lead)",
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
"t": "Ok the last thing we need to do is schedule your appointment. Our consultant will be reviewing a few things with you such as: The design, the cost, your estimated ROI, warranties, equipment, etc... Our first step is to review this information with you and if you love it, we can schedule a technician to come out to inspect the home further!",
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
"t": " Are there any upcoming appointments we need to schedule around?",
"red": false,
"bold": true
},
{
"t": "(If they have more solar appts, try to schedule us last) ",
"red": true,
"bold": true
},
{
"t": "It looks like we have a guy in your area DAY and again on DATE. Which day works best for you?",
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
"t": " I blocked off that time for an hour to ensure you don't feel rushed. It normally doesn't take that long though. If you need to reschedule for any reason, please let me know as soon as possible. ",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
{
"t": "We'll give you a call or shoot you a text a couple hours before the appointment to reconfirm your availability. I'd suggest writing down any questions or concerns about going solar prior to the appointment so you don't forget to ask your Solar Specialist anything important. ",
"red": false,
"bold": true
}
]
},
{
"head": false,
"runs": [
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
"t": "Other than that, we'll see you at (",
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
