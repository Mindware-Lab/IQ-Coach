import type { NodeId } from "./node";
import type { WrapperPhase } from "./progression";

export type WrapperMode = "A" | "B" | "C" | "AB_MIXED";

export interface SessionConfig {
  nodeId: NodeId;
  sessionId: string;
  phase: WrapperPhase;
  wrapperMode: WrapperMode;
  targetMinutes: number;
  seed?: string;
}

export interface GameSession {
  id: string;
  config: SessionConfig;
}

export interface DisplayMetric {
  label: string;
  value: string | number;
}

export interface TrainingSummary {
  progressionScore: number;
  validTrials: number;
  accuracy?: number;
  level?: number;
  displayMetrics?: DisplayMetric[];
}

export type GameCompleteHandler = (summary: TrainingSummary) => void;

export interface GameAdapter {
  createSession(config: SessionConfig): GameSession;
  mount(container: HTMLElement): Promise<void> | void;
  start(): Promise<void> | void;
  pause?(): void;
  resume?(): void;
  destroy(): void;
  setWrapper(wrapper: "A" | "B"): void;
  getTrainingSummary(): TrainingSummary;
  onComplete?(handler: GameCompleteHandler | null): void;
}
