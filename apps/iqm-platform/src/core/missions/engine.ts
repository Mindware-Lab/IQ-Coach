import type {
  MissionBarrier,
  MissionCheckin,
} from "../../types/mission";

export type MissionFollowUp =
  | "NONE"
  | "RESCHEDULE_OR_NEW_CONTEXT"
  | "STRENGTHEN_CUE"
  | "SHARPEN_TARGET_CUE"
  | "REDESIGN_NICHE_SUPPORT"
  | "REVISIT_ANTI_CUES"
  | "REDUCE_FRICTION"
  | "HUMAN_REVIEW";

const barrierFollowUps: Record<MissionBarrier, MissionFollowUp> = {
  forgot: "STRENGTHEN_CUE",
  "did-not-notice-cue": "SHARPEN_TARGET_CUE",
  "too-busy-under-pressure": "REDUCE_FRICTION",
  "environment-got-in-way": "REDESIGN_NICHE_SUPPORT",
  "strategy-did-not-fit": "REVISIT_ANTI_CUES",
  other: "HUMAN_REVIEW",
};

export function recommendMissionFollowUp(
  checkin: MissionCheckin,
): MissionFollowUp {
  if (!checkin.opportunityOccurred) {
    return "RESCHEDULE_OR_NEW_CONTEXT";
  }
  if (checkin.strategyUse === "no" && checkin.barrier) {
    return barrierFollowUps[checkin.barrier];
  }
  return "NONE";
}

export function isMissionCheckinComplete(checkin: MissionCheckin): boolean {
  if (!checkin.opportunityOccurred) return true;
  return Boolean(
    checkin.strategyUse &&
      checkin.effect &&
      checkin.environmentHelp,
  );
}
