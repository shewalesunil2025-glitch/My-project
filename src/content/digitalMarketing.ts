import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  Camera,
  MapPin,
  Megaphone,
  MessageCircle,
  PenTool,
  Search,
  Sparkles,
  Target,
  UserRoundCheck,
} from "lucide-react";

/**
 * The Digital Marketing premium package — the service the site highlights
 * everywhere. Price must match the Automation Store entry in shambhu.ts.
 */
export const digitalMarketing = {
  id: "digital-marketing",
  href: "#digital-marketing",
  title: "Digital Marketing",
  tagline: "Your complete digital marketing team — run by IBAX AI, guided by people.",
  price: "$299",
  billing: "/mo",
  interest: "Digital Marketing — premium package",
  /** Honest limits shown beside the price. */
  notes: ["Ad spend is paid separately, straight to Meta or Google", "Nothing is posted without your approval"],
};

export type Inclusion = { title: string; body: string; icon: LucideIcon };

/** What the package includes. */
export const inclusions: Inclusion[] = [
  { title: "Social media management", body: "Instagram, Facebook and YouTube planned, posted and answered.", icon: Camera },
  { title: "Content creation", body: "Posts, reels ideas, captions and hashtags in your brand voice.", icon: PenTool },
  { title: "Monthly content calendar", body: "A clear plan for the month, ready for your approval.", icon: CalendarDays },
  { title: "Ad campaigns", body: "Meta and Google Ads set up, targeted and managed.", icon: Target },
  { title: "Local SEO & Google Business", body: "Your Google Business Profile optimised so nearby customers find you.", icon: MapPin },
  { title: "Website SEO basics", body: "Titles, keywords and speed checks so search engines understand you.", icon: Search },
  { title: "WhatsApp campaigns", body: "Offers and updates sent to customers who opted in.", icon: MessageCircle },
  { title: "Lead follow-up", body: "Every enquiry from your campaigns followed up by IBAX AI.", icon: UserRoundCheck },
  { title: "Monthly report", body: "What went out, what people did and what we'll do next.", icon: BarChart3 },
];

/** How a month of Digital Marketing runs. */
export const marketingSteps: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Plan", body: "Goals, audience and the month's calendar.", icon: CalendarDays },
  { title: "Create", body: "Posts, captions and ads made for you.", icon: Sparkles },
  { title: "Approve", body: "You check everything in one tap.", icon: UserRoundCheck },
  { title: "Publish & promote", body: "Posted on time, ads run to the right people.", icon: Megaphone },
  { title: "Report", body: "A simple monthly report, then we improve.", icon: BarChart3 },
];
