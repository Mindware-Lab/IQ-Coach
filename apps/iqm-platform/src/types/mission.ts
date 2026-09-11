import type { NodeId } from "./node";

export type NicheChangeType =
  | "cue"
  | "workflow"
  | "protected-time"
  | "reduce-interference"
  | "resource-visibility"
  | "scheduling"
  | "feedback"
  | "tool-interface"
  | "none";

export interface MissionTemplate {
  id: string;
  title: string;
  contextExample: string;
  targetCue: string;
  intendedPolicy: string;
  suggestedNicheChanges?: NicheChangeType[];
}

export interface Mission {
  id: string;
  nodeId: NodeId;
  context: string;
  targetCue: string;
  intendedPolicy: string;
  nicheChangeType?: NicheChangeType;
  nicheChangeNote?: string;
  status: "planned" | "done" | "expired" | "reschedule";
  createdAt: string;
  dueAt?: string;
}

export type StrategyUse = "yes" | "partly" | "no";
export type MissionEffect = "helped" | "no-clear-difference" | "made-it-harder" | "not-sure";
export type EnvironmentHelp = "yes" | "no" | "no-change";
export type MissionBarrier =
  | "forgot"
  | "did-not-notice-cue"
  | "too-busy-under-pressure"
  | "environment-got-in-way"
  | "strategy-did-not-fit"
  | "other";

export interface MissionCheckin {
  id: string;
  missionId: string;
  userId: string;
  nodeId: NodeId;
  opportunityOccurred: boolean;
  strategyUse?: StrategyUse;
  effect?: MissionEffect;
  environmentHelp?: EnvironmentHelp;
  barrier?: MissionBarrier;
  note?: string;
  createdAt: string;
}
