import type { AutomationStatus, ContentStatus, LeadStatus } from "@/lib/app/types";
import type { PillTone } from "./ui";

export const automationStatus: Record<AutomationStatus, { label: string; tone: PillTone }> = {
  setup: { label: "Setup in progress", tone: "blue" },
  active: { label: "Active", tone: "green" },
  paused: { label: "Paused", tone: "gray" },
  scheduled: { label: "Scheduled", tone: "blue" },
  failed: { label: "Failed", tone: "red" },
  attention: { label: "Needs attention", tone: "amber" },
};

export const contentStatus: Record<ContentStatus, { label: string; tone: PillTone }> = {
  draft: { label: "Draft", tone: "gray" },
  approval: { label: "Needs approval", tone: "amber" },
  scheduled: { label: "Scheduled", tone: "blue" },
  published: { label: "Published", tone: "green" },
};

export const leadStatus: Record<LeadStatus, { label: string; tone: PillTone }> = {
  new: { label: "New", tone: "ember" },
  contacted: { label: "Contacted", tone: "blue" },
  follow_up: { label: "Follow-up required", tone: "amber" },
  converted: { label: "Converted", tone: "green" },
  lost: { label: "Lost", tone: "gray" },
};
