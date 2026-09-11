import type { TrainingSummary } from "../../../types/game";
import type { GenerativeFamily } from "./prompts";

export interface GenerativeResponse {
  text: string;
  submittedAtMs: number;
  afterSwitchCue: boolean;
}

export interface GenerativeRoundResult {
  promptId: string;
  family: GenerativeFamily;
  wrapper: "A" | "B";
  startedAtMs: number;
  endedAtMs: number;
  switchCueShownAtMs?: number;
  responses: GenerativeResponse[];
  commitment: "DONE" | "CONTINUE_THEN_DONE";
  commitmentAtMs: number;
}

export interface GenerativeComponentProfile {
  responseCount: number;
  formatValidResponseCount: number;
  uniqueResponseCount: number;
  generationRatePerMinute: number;
  redundancyRate: number;
  timeToFirstResponseMs: number | null;
  medianInterResponseLatencyMs: number | null;
  switchCueCompliance: number | null;
  medianPostSwitchLatencyMs: number | null;
}

export function normaliseResponse(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function scoreGenerativeRounds(
  rounds: GenerativeRoundResult[],
): GenerativeComponentProfile {
  const allResponses = rounds.flatMap((round) => round.responses);
  const valid = allResponses
    .map((response) => ({ ...response, normalised: normaliseResponse(response.text) }))
    .filter((response) => response.normalised.length > 0);
  const unique = new Set(valid.map((response) => response.normalised));
  const activeMs = rounds.reduce(
    (sum, round) => sum + Math.max(0, round.endedAtMs - round.startedAtMs),
    0,
  );
  const generationRatePerMinute = activeMs > 0
    ? (valid.length / activeMs) * 60_000
    : 0;
  const redundancyRate = valid.length > 0
    ? 1 - unique.size / valid.length
    : 0;

  const firstLatencies = rounds
    .map((round) => round.responses[0]?.submittedAtMs ?? null)
    .filter((value): value is number => value !== null);

  const interResponseLatencies: number[] = [];
  for (const round of rounds) {
    for (let index = 1; index < round.responses.length; index += 1) {
      interResponseLatencies.push(
        round.responses[index].submittedAtMs - round.responses[index - 1].submittedAtMs,
      );
    }
  }

  const switchRounds = rounds.filter((round) => round.switchCueShownAtMs !== undefined);
  const compliantSwitchRounds = switchRounds.filter((round) =>
    round.responses.some((response) => response.afterSwitchCue),
  );
  const switchCueCompliance = switchRounds.length
    ? compliantSwitchRounds.length / switchRounds.length
    : null;

  const postSwitchLatencies = switchRounds.flatMap((round) => {
    const first = round.responses.find((response) => response.afterSwitchCue);
    return first && round.switchCueShownAtMs !== undefined
      ? [first.submittedAtMs - round.switchCueShownAtMs]
      : [];
  });

  return {
    responseCount: allResponses.length,
    formatValidResponseCount: valid.length,
    uniqueResponseCount: unique.size,
    generationRatePerMinute,
    redundancyRate,
    timeToFirstResponseMs: median(firstLatencies),
    medianInterResponseLatencyMs: median(interResponseLatencies),
    switchCueCompliance,
    medianPostSwitchLatencyMs: median(postSwitchLatencies),
  };
}

/**
 * Phase-1 shared-platform progression needs a bounded scalar to decide when to
 * change wrapper. For Generative Search this is deliberately only a product
 * completion signal: the proportion of a modest minimum number of non-duplicate
 * responses produced. It is not displayed as creativity, originality, transfer
 * or a validated construct composite.
 */
export function productProgressionSignal(
  profile: GenerativeComponentProfile,
  rounds: number,
): number {
  const targetUniqueResponses = Math.max(1, rounds * 3);
  return Math.max(0, Math.min(1, profile.uniqueResponseCount / targetUniqueResponses));
}

export function trainingSummaryFromGenerativeRounds(
  rounds: GenerativeRoundResult[],
): TrainingSummary {
  const profile = scoreGenerativeRounds(rounds);
  const switchDisplay = profile.switchCueCompliance === null
    ? "—"
    : `${Math.round(profile.switchCueCompliance * 100)}%`;
  return {
    progressionScore: productProgressionSignal(profile, rounds.length),
    validTrials: profile.formatValidResponseCount,
    displayMetrics: [
      {
        label: "Generation rate",
        value: `${profile.generationRatePerMinute.toFixed(1)} / min`,
      },
      {
        label: "Switch cue followed",
        value: switchDisplay,
      },
      {
        label: "Exact redundancy",
        value: `${Math.round(profile.redundancyRate * 100)}%`,
      },
      {
        label: "First response",
        value: profile.timeToFirstResponseMs === null
          ? "—"
          : `${Math.round(profile.timeToFirstResponseMs)} ms`,
      },
    ],
  };
}
