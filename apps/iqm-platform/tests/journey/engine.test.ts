import { describe, expect, it } from "vitest";
import { journeyStageStatuses, nextJourneyStage } from "../../src/core/journey/engine";

const base = {
  chapterSeen: false,
  sessionsCompleted: 0,
  strategyStarted: false,
  missionsPlanned: 0,
  missionCheckins: 0,
  bankedRules: 0,
};

describe("adaptive journey orchestration", () => {
  it("moves from understanding to training, use, reality and banking", () => {
    expect(nextJourneyStage(base)).toBe("understand");
    expect(nextJourneyStage({ ...base, chapterSeen: true })).toBe("train");
    expect(nextJourneyStage({ ...base, chapterSeen: true, sessionsCompleted: 1 })).toBe("use");
    expect(nextJourneyStage({ ...base, chapterSeen: true, sessionsCompleted: 1, strategyStarted: true })).toBe("apply");
    expect(nextJourneyStage({ ...base, chapterSeen: true, sessionsCompleted: 1, strategyStarted: true, missionsPlanned: 1 })).toBe("review");
    expect(nextJourneyStage({ ...base, chapterSeen: true, sessionsCompleted: 1, strategyStarted: true, missionsPlanned: 1, missionCheckins: 1 })).toBe("bank");
    expect(nextJourneyStage({ ...base, chapterSeen: true, sessionsCompleted: 1, strategyStarted: true, missionsPlanned: 1, missionCheckins: 1, bankedRules: 1 })).toBe("continue");
  });

  it("reports a simple five-stage journey without inventing scientific scores", () => {
    const statuses = journeyStageStatuses({
      ...base,
      chapterSeen: true,
      sessionsCompleted: 1,
      strategyStarted: true,
    });
    expect(statuses.map((stage) => stage.id)).toEqual(["understand", "train", "use", "apply", "review"]);
    expect(statuses.filter((stage) => stage.complete).map((stage) => stage.id)).toEqual(["understand", "train", "use"]);
    expect(statuses.find((stage) => stage.current)?.id).toBe("apply");
  });
});
