import {
  Bell,
  Bot,
  CalendarCheck,
  Database,
  Globe,
  MessageCircle,
  PhoneCall,
  Repeat,
  Star,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

export type FlowNode = {
  id: string;
  label: string;
  detail: string;
  icon: LucideIcon;
};

/** The customer journey Nexa Flow AI automates end-to-end. */
export const customerFlow: FlowNode[] = [
  { id: "website", label: "Website", detail: "A visitor lands on a site built to convert.", icon: Globe },
  { id: "conversation", label: "AI Conversation", detail: "AI answers questions instantly, 24/7.", icon: Bot },
  { id: "lead", label: "Lead Capture", detail: "Name, need and intent — captured and qualified.", icon: UserPlus },
  { id: "whatsapp", label: "WhatsApp", detail: "The conversation continues where customers already are.", icon: MessageCircle },
  { id: "booking", label: "Booking", detail: "An appointment lands in your calendar.", icon: CalendarCheck },
  { id: "reminder", label: "Reminder", detail: "Automatic reminders reduce no-shows.", icon: Bell },
  { id: "followup", label: "Follow-up", detail: "Every customer hears back. Nobody slips.", icon: Repeat },
  { id: "review", label: "Google Review", detail: "Happy customers are invited to leave a review.", icon: Star },
];

/** The fragmented tools most businesses juggle today. */
export const fragmentedTools = ["Website", "WhatsApp", "Phone", "Bookings", "Follow-ups", "Reviews"] as const;

/** The six connected systems around the central Nexa AI, each with the job it does. */
export const ecosystem: { label: string; benefit: string; icon: LucideIcon }[] = [
  { label: "Website", benefit: "Brings customers in", icon: Globe },
  { label: "WhatsApp", benefit: "Replies instantly", icon: MessageCircle },
  { label: "AI Voice", benefit: "Answers every call", icon: PhoneCall },
  { label: "Booking", benefit: "Fills your calendar", icon: CalendarCheck },
  { label: "CRM", benefit: "Remembers every customer", icon: Database },
  { label: "Reviews", benefit: "Grows your rating", icon: Star },
];
