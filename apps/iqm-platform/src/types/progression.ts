import type { TrainingSummary, WrapperMode } from "./game";

export type WrapperPhase =
  | "A_BASELINE"
  | "A_TRAIN"
  | "B_INTRO"
  | "B_RECOVERY"
  | "A_RETURN"
  | "A_REOPEN"
  | "AB_MIXED"
  | "AB_MAINTENANCE";

export interface WrapperProgressionConfig {
  minASessions: number;
  maxASessionsBeforeProbe: number;
  minBSessions: number;
  maxBSessions: number;
  minAReturnBlocks: number;
  maxAReopenSessions: number;
  plateauWindow: number;
  plateauTolerance: number;
  reopenDelta?: number;
  reopenSlopeMin?: number;
  mixedSelection: "trial" | "mini-block" | "block";
}

export interface WrapperProgressionState {
  phase: WrapperPhase;
  sessionsInPhase: number;
  totalSessions: number;
  aScores: number[];
  bScores: number[];
  aReopenScores: number[];
  aPlateauReference?: number;
  bCurrentReference?: number;
  aReturnReference?: number;
}

export interface ProgressionObservation {
  summary: TrainingSummary;
  wrapperMode: WrapperMode;
  dataQualityAdequate: boolean;
}

export interface ProgressionDecision {
  previousPhase: WrapperPhase;
  nextPhase: WrapperPhase;
  phaseChanged: boolean;
  reason: string;
  state: WrapperProgressionState;
}
