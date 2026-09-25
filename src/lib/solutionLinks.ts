import type { SolutionId } from "@/content/solutions";

/** Anchor of a solution's card in the Solutions bento grid. */
export function solutionAnchor(id: SolutionId) {
  return `#solution-${id}`;
}
