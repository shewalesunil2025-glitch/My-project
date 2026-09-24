import type { SolutionId } from "@/content/solutions";

/** Event other sections dispatch to open a specific solution demo. */
export const SHOW_SOLUTION_EVENT = "nexa:show-solution";

/** Anchor of the Solutions demo area — links scroll here, then the tab switches. */
export const SOLUTION_DEMO_ANCHOR = "#solutions-demo";

export function showSolution(id: SolutionId) {
  window.dispatchEvent(new CustomEvent<SolutionId>(SHOW_SOLUTION_EVENT, { detail: id }));
}
