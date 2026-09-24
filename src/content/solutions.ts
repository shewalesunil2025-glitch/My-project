export type SolutionId =
  | "websites"
  | "whatsapp"
  | "voice"
  | "chatbots"
  | "booking"
  | "reviews"
  | "workflows";

export type Solution = {
  id: SolutionId;
  index: string;
  title: string;
  headline: string;
  summary: string;
  steps: string[];
};

export const solutions: Solution[] = [
  {
    id: "websites",
    index: "01",
    title: "AI-Powered Websites",
    headline: "Your website should do more than look good.",
    summary: "Premium design that captures leads, answers questions and books appointments on its own.",
    steps: ["Premium UI", "Lead capture", "Smart interactions", "Booking", "AI built in"],
  },
  {
    id: "whatsapp",
    index: "02",
    title: "AI WhatsApp Automation",
    headline: "Your customers are on WhatsApp. So is your AI.",
    summary: "Instant replies that inform, qualify and book — then follow up automatically.",
    steps: ["Customer message", "AI response", "Information", "Qualification", "Booking", "Follow-up"],
  },
  {
    id: "voice",
    index: "03",
    title: "AI Voice Receptionist",
    headline: "Every call answered. Even at 2 a.m.",
    summary: "A natural-sounding voice agent that understands, answers and books — then confirms by message.",
    steps: ["Incoming call", "AI answers", "Understands", "Answers questions", "Books appointment", "Sends confirmation"],
  },
  {
    id: "chatbots",
    index: "04",
    title: "AI Chatbots",
    headline: "Conversations that actually convert.",
    summary: "Trained on your business, your tone and your services — not a generic script.",
    steps: ["Visitor asks", "AI understands", "Answers from your data", "Hands off to a human when needed"],
  },
  {
    id: "booking",
    index: "05",
    title: "Booking Automation",
    headline: "From inquiry to confirmed — without a single call.",
    summary: "Calendars, confirmations and reminders that run themselves.",
    steps: ["Inquiry", "Appointment", "Confirmation", "Reminder"],
  },
  {
    id: "reviews",
    index: "06",
    title: "Review Automation",
    headline: "Turn great service into great reputation.",
    summary: "The right message, at the right moment, asking the right customers for a Google review.",
    steps: ["Completed service", "Customer follow-up", "Google Review request"],
  },
  {
    id: "workflows",
    index: "07",
    title: "Business Workflow Automation",
    headline: "Let AI handle the repetitive work.",
    summary: "Your CRM, calendar, sheets and messaging — connected, so data moves on its own.",
    steps: ["Trigger", "AI decision", "Update CRM", "Notify team", "Done"],
  },
];
