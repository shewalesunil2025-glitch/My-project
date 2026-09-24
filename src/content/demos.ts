export type DemoEvent = { time: string; channel: string; text: string };

export type Demo = {
  id: string;
  name: string;
  industry: string;
  summary: string;
  systems: string[];
  /** Scripted sample events used to illustrate the flow — not real customer data. */
  events: DemoEvent[];
  /** Link to the live demo site once it is deployed. Empty = not yet published. */
  href: string;
};

export const demos: Demo[] = [
  {
    id: "dental",
    name: "Smile Studio",
    industry: "Dental Clinic",
    summary: "A clinic website where AI answers treatment questions, books on WhatsApp and asks for reviews after each visit.",
    systems: ["Website", "AI Chat", "WhatsApp", "Booking", "Reviews"],
    events: [
      { time: "09:02", channel: "Web", text: "Visitor asks about teeth whitening cost" },
      { time: "09:02", channel: "AI", text: "Answers with pricing + offers a consult" },
      { time: "09:03", channel: "WhatsApp", text: "Booking confirmed — Thu 4:30 PM" },
      { time: "Wed", channel: "Reminder", text: "Reminder sent 24h before visit" },
      { time: "Thu", channel: "Review", text: "Review request sent after visit" },
    ],
    href: "",
  },
  {
    id: "restaurant",
    name: "Ember Table",
    industry: "Restaurant",
    summary: "Reservations, menu questions and private-event inquiries handled by AI chat and a voice receptionist.",
    systems: ["Website", "AI Voice", "Reservations", "WhatsApp"],
    events: [
      { time: "19:41", channel: "Call", text: "Incoming call — table for 6 on Saturday" },
      { time: "19:41", channel: "Voice AI", text: "Checks availability, offers 8:00 PM" },
      { time: "19:42", channel: "WhatsApp", text: "Confirmation + directions sent" },
      { time: "Sun", channel: "Follow-up", text: "Thank-you message + review link" },
    ],
    href: "",
  },
  {
    id: "real-estate",
    name: "Northline Realty",
    industry: "Real Estate",
    summary: "Listing inquiries qualified by AI, routed to the right agent and followed up until a site visit is booked.",
    systems: ["Website", "AI Qualification", "CRM", "WhatsApp", "Follow-up"],
    events: [
      { time: "11:15", channel: "Web", text: "Inquiry on 3BHK listing" },
      { time: "11:15", channel: "AI", text: "Qualifies budget, timeline, location" },
      { time: "11:16", channel: "CRM", text: "Lead created, agent assigned" },
      { time: "11:16", channel: "WhatsApp", text: "Site visit slots shared" },
      { time: "+2d", channel: "Follow-up", text: "Automatic nudge if no reply" },
    ],
    href: "",
  },
];
