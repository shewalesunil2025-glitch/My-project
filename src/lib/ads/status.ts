import type { AdStatus } from "./types";

/** A campaign only moves forward along these paths. "active" is set only after the platform confirms it. */
const NEXT: Record<AdStatus, AdStatus[]> = {
  draft: ["creatives_ready", "awaiting_approval", "failed"],
  creatives_ready: ["draft", "awaiting_approval", "failed"],
  awaiting_approval: ["draft", "creatives_ready", "awaiting_payment", "failed"],
  awaiting_payment: ["awaiting_approval", "paid", "failed"],
  paid: ["ready_to_launch", "failed"],
  ready_to_launch: ["submitted", "failed"],
  submitted: ["active", "rejected", "failed"],
  active: ["paused", "completed", "failed"],
  paused: ["active", "completed", "failed"],
  completed: [],
  rejected: ["ready_to_launch"],
  failed: ["draft"],
};

export const canMove = (from: AdStatus, to: AdStatus) => NEXT[from]?.includes(to) ?? false;

/** Statuses where the client can still change the brief and the creatives. */
export const EDITABLE: readonly AdStatus[] = ["draft", "creatives_ready", "awaiting_approval"];

export const STATUS_LABEL: Record<AdStatus, string> = {
  draft: "Draft",
  creatives_ready: "Creatives ready",
  awaiting_approval: "Awaiting your approval",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  ready_to_launch: "Ready to launch",
  submitted: "Submitted to Meta",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  rejected: "Rejected by Meta",
  failed: "Failed",
};

export const STATUS_TONE: Record<AdStatus, "gray" | "blue" | "green" | "amber" | "red"> = {
  draft: "gray",
  creatives_ready: "blue",
  awaiting_approval: "amber",
  awaiting_payment: "amber",
  paid: "blue",
  ready_to_launch: "blue",
  submitted: "blue",
  active: "green",
  paused: "amber",
  completed: "gray",
  rejected: "red",
  failed: "red",
};
