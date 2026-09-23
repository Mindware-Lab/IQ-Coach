export type JourneyStageId =
  | "understand"
  | "train"
  | "use"
  | "apply"
  | "review"
  | "bank"
  | "continue";

export interface JourneyStateInput {
  chapterSeen: boolean;
  sessionsCompleted: number;
  strategyStarted: boolean;
  missionsPlanned: number;
  missionCheckins: number;
  bankedRules: number;
}

export interface JourneyStageStatus {
  id: "understand" | "train" | "use" | "apply" | "review";
  complete: boolean;
  current: boolean;
}

export function nextJourneyStage(input: JourneyStateInput): JourneyStageId {
  if (!input.chapterSeen) return "understand";
  if (input.sessionsCompleted === 0) return "train";
  if (!input.strategyStarted) return "use";
  if (input.missionsPlanned === 0) return "apply";
  if (input.missionCheckins === 0) return "review";
  if (input.bankedRules === 0) return "bank";
  return "continue";
}

export function journeyStageStatuses(input: JourneyStateInput): JourneyStageStatus[] {
  const next = nextJourneyStage(input);
  const order: JourneyStageStatus["id"][] = ["understand", "train", "use", "apply", "review"];
  const completed = new Set<JourneyStageStatus["id"]>();
  if (input.chapterSeen) completed.add("understand");
  if (input.sessionsCompleted > 0) completed.add("train");
  if (input.strategyStarted) completed.add("use");
  if (input.missionsPlanned > 0) completed.add("apply");
  if (input.missionCheckins > 0) completed.add("review");

  const current = next === "bank" || next === "continue" ? null : next;
  return order.map((id) => ({ id, complete: completed.has(id), current: id === current }));
}
