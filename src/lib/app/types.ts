/** Data model of one Lumi workspace. One customer → one workspace → one business. */

export type ProviderId = "youtube" | "instagram" | "facebook" | "whatsapp" | "google" | "gmail" | "phone" | "website";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  passwordHash: string;
  createdAt: string;
};

export type Business = {
  category: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  websiteUrl: string;
  description: string;
  hours: string;
  services: string;
  targetCustomers: string;
  socialLinks: string;
  logo?: string;
};

export type AssistantProfile = {
  name: string;
  language: string;
  tone: string;
  personality: string;
  welcome: string;
};

export type PlanPeriod = "monthly" | "annual";

export type Subscription = {
  id: string;
  serviceId: string;
  period: PlanPeriod;
  price: number;
  status: "active" | "cancelled";
  startedAt: string;
  renewsAt: string;
};

export type Invoice = {
  id: string;
  number: string;
  serviceId: string;
  period: PlanPeriod;
  amount: number;
  date: string;
  status: "paid" | "test";
};

export type AutomationStatus = "setup" | "active" | "paused" | "scheduled" | "failed" | "attention";

export type LogEntry = { at: string; level: "info" | "success" | "warning" | "error"; message: string };

export type Automation = {
  id: string;
  serviceId: string;
  subscriptionId: string;
  status: AutomationStatus;
  /** Answers collected by the activation wizard. */
  config: Record<string, string | boolean>;
  /** Index of the next wizard step while status is "setup". */
  setupStep: number;
  tested: boolean;
  createdAt: string;
  activatedAt?: string;
  lastRunAt?: string;
  note?: string;
  logs: LogEntry[];
};

export type Connection = {
  provider: ProviderId;
  status: "connected" | "error";
  account: string;
  connectedAt: string;
  /** Preview mode: a simulated connection, not a real OAuth grant. */
  simulated: boolean;
};

export type ActivityKind = "call" | "whatsapp" | "email" | "instagram" | "facebook" | "youtube" | "review" | "lead" | "automation" | "payment" | "website" | "system";

export type ActivityEvent = {
  id: string;
  at: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  href?: string;
};

export type LeadStatus = "new" | "contacted" | "follow_up" | "converted" | "lost";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  interest: string;
  status: LeadStatus;
  returning: boolean;
  createdAt: string;
  followUpAt?: string;
  notes: string;
};

export type Channel = "whatsapp" | "instagram" | "facebook" | "email";

export type Conversation = {
  id: string;
  channel: Channel;
  contact: string;
  at: string;
  messages: { from: "customer" | "assistant" | "owner"; text: string; at: string }[];
  important: boolean;
};

export type Call = {
  id: string;
  at: string;
  caller: string;
  number: string;
  durationSec: number;
  outcome: "answered" | "appointment" | "lead" | "transferred" | "missed";
  summary: string;
};

export type Review = {
  id: string;
  at: string;
  author: string;
  rating: number;
  text: string;
  reply?: string;
  suggestedReply?: string;
};

export type ContentType = "video" | "reel" | "short" | "image" | "caption" | "post" | "script";
export type ContentStatus = "draft" | "approval" | "scheduled" | "published";

export type ContentItem = {
  id: string;
  type: ContentType;
  platform: "youtube" | "instagram" | "facebook" | "website" | "email";
  title: string;
  body: string;
  hashtags?: string;
  status: ContentStatus;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  stats?: { views: number; likes: number; comments: number };
};

export type NotificationKind =
  | "lead"
  | "review"
  | "message"
  | "automation_failed"
  | "published"
  | "upcoming"
  | "payment"
  | "expiry"
  | "connection";

export type AppNotification = {
  id: string;
  at: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  href?: string;
  read: boolean;
};

export type Ticket = {
  id: string;
  number: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: string;
  links?: { label: string; href: string }[];
};

export type DailyMetric = {
  date: string; // YYYY-MM-DD
  leads: number;
  calls: number;
  messages: number;
  visitors: number;
  reach: number;
  views: number;
  engagement: number;
  reviews: number;
  conversions: number;
};

export type WebsiteProject = {
  status: "draft" | "requested" | "live";
  template: "classic" | "bold" | "minimal";
  pages: string[];
  headline: string;
  about: string;
  accent: string;
  connectedUrl?: string;
  updatedAt: string;
};

export type AuditEntry = { at: string; action: string };

export type TeamRole = "owner" | "manager" | "viewer";

export type Workspace = {
  id: string;
  ownerId: string;
  createdAt: string;
  /** True for the sample workspace — every screen labels its data as sample data. */
  sample: boolean;
  business: Business | null;
  assistant: AssistantProfile | null;
  subscriptions: Subscription[];
  invoices: Invoice[];
  automations: Automation[];
  connections: Partial<Record<ProviderId, Connection>>;
  activity: ActivityEvent[];
  leads: Lead[];
  conversations: Conversation[];
  calls: Call[];
  reviews: Review[];
  content: ContentItem[];
  notifications: AppNotification[];
  tickets: Ticket[];
  chat: ChatMessage[];
  metrics: DailyMetric[];
  website: WebsiteProject | null;
  team: { id: string; name: string; email: string; role: TeamRole }[];
  security: { twoFactor: boolean; lastPasswordChange?: string };
  notificationPrefs: Record<NotificationKind, boolean>;
  audit: AuditEntry[];
};

export type Database = {
  version: 1;
  users: User[];
  sessionUserId: string | null;
  /** Keyed by user id — each customer only ever reads their own workspace. */
  workspaces: Record<string, Workspace>;
};
