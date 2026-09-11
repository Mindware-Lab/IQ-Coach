import type { AttentionRatio } from "./trial";

export interface AttentionCondition {
  ratio: AttentionRatio;
  exposureMs: number;
}

export const ATTENTION_STAIRCASE: readonly AttentionCondition[] = [
  { ratio: "5:0", exposureMs: 1500 },
  { ratio: "5:0", exposureMs: 1000 },
  { ratio: "4:1", exposureMs: 1000 },
  { ratio: "4:1", exposureMs: 700 },
  { ratio: "4:1", exposureMs: 500 },
  { ratio: "3:2", exposureMs: 700 },
  { ratio: "3:2", exposureMs: 500 },
  { ratio: "3:2", exposureMs: 300 },
  { ratio: "3:2", exposureMs: 200 },
  { ratio: "3:2", exposureMs: 150 },
] as const;

export const INITIAL_ATTENTION_LEVEL = 4;

export function clampAttentionLevel(level: number): number {
  return Math.max(0, Math.min(ATTENTION_STAIRCASE.length - 1, Math.round(level)));
}

export function attentionConditionForLevel(level: number): AttentionCondition {
  return ATTENTION_STAIRCASE[clampAttentionLevel(level)];
}

export function nextAttentionLevel(level: number, correct: boolean): number {
  return clampAttentionLevel(level + (correct ? 1 : -1));
}

export function normalisedAttentionLevel(level: number): number {
  return clampAttentionLevel(level) / (ATTENTION_STAIRCASE.length - 1);
}
