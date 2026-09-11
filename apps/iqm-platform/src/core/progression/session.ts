import type { WrapperMode } from "../../types/game";
import type { WrapperPhase } from "../../types/progression";

export function wrapperModeForPhase(phase: WrapperPhase): WrapperMode {
  if (phase === "B_INTRO" || phase === "B_RECOVERY") return "B";
  if (phase === "AB_MIXED" || phase === "AB_MAINTENANCE") return "AB_MIXED";
  return "A";
}

export const PHASE_PUBLIC_LABELS: Record<WrapperPhase, string> = {
  A_BASELINE: "Getting your starting level",
  A_TRAIN: "Building the skill",
  B_INTRO: "New format",
  B_RECOVERY: "Rebuilding the skill",
  A_RETURN: "Back to the original",
  A_REOPEN: "Building further",
  AB_MIXED: "Flexible practice",
  AB_MAINTENANCE: "Keep it flexible",
};
