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
  Workflow,
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

/** Satellites around the central automation layer. */
export const ecosystem: { label: string; icon: LucideIcon }[] = [
  { label: "Website", icon: Globe },
  { label: "WhatsApp", icon: MessageCircle },
  { label: "Voice", icon: PhoneCall },
  { label: "AI Chat", icon: Bot },
  { label: "CRM", icon: Database },
  { label: "Booking", icon: CalendarCheck },
  { label: "Reviews", icon: Star },
  { label: "Follow-ups", icon: Workflow },
];
