import { describe, expect, it } from "vitest";
import {
  isMissionCheckinComplete,
  recommendMissionFollowUp,
} from "../../src/core/missions/engine";
import type { MissionCheckin } from "../../src/types/mission";

function baseCheckin(overrides: Partial<MissionCheckin> = {}): MissionCheckin {
  return {
    id: "checkin-1",
    missionId: "mission-1",
    userId: "user-1",
    nodeId: "attention",
    opportunityOccurred: true,
    strategyUse: "yes",
    effect: "helped",
    environmentHelp: "yes",
    createdAt: "2026-09-11T12:00:00Z",
    ...overrides,
  };
}

describe("mission check-ins", () => {
  it("does not treat a missing opportunity as failure", () => {
    const checkin = baseCheckin({
      opportunityOccurred: false,
      strategyUse: undefined,
      effect: undefined,
      environmentHelp: undefined,
    });
    expect(isMissionCheckinComplete(checkin)).toBe(true);
    expect(recommendMissionFollowUp(checkin)).toBe("RESCHEDULE_OR_NEW_CONTEXT");
  });

  it("maps implementation barriers to practical follow-ups", () => {
    const checkin = baseCheckin({
      strategyUse: "no",
      barrier: "environment-got-in-way",
    });
    expect(recommendMissionFollowUp(checkin)).toBe("REDESIGN_NICHE_SUPPORT");
  });
});
