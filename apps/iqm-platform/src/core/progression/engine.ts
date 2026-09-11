import type {
  ProgressionDecision,
  ProgressionObservation,
  WrapperProgressionConfig,
  WrapperProgressionState,
  WrapperPhase,
} from "../../types/progression";

export function createInitialProgressionState(): WrapperProgressionState {
  return {
    phase: "A_BASELINE",
    sessionsInPhase: 0,
    totalSessions: 0,
    aScores: [],
    bScores: [],
    aReopenScores: [],
  };
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i += 1) {
    const x = i - xMean;
    numerator += x * (values[i] - yMean);
    denominator += x * x;
  }
  return denominator ? numerator / denominator : 0;
}

export function isPlateau(
  scores: number[],
  window: number,
  tolerance: number,
): boolean {
  if (scores.length < window || window < 2) return false;
  const recent = scores.slice(-window);
  return Math.abs(linearSlope(recent)) <= tolerance;
}

function isRecovering(scores: number[]): boolean {
  return scores.length >= 2 && linearSlope(scores) > 0;
}

function copyState(state: WrapperProgressionState): WrapperProgressionState {
  return {
    ...state,
    aScores: [...state.aScores],
    bScores: [...state.bScores],
    aReopenScores: [...state.aReopenScores],
  };
}

function transition(
  state: WrapperProgressionState,
  nextPhase: WrapperPhase,
  reason: string,
): ProgressionDecision {
  const previousPhase = state.phase;
  const phaseChanged = previousPhase !== nextPhase;
  return {
    previousPhase,
    nextPhase,
    phaseChanged,
    reason,
    state: {
      ...state,
      phase: nextPhase,
      sessionsInPhase: phaseChanged ? 0 : state.sessionsInPhase,
    },
  };
}

export function recordProgressionSession(
  prior: WrapperProgressionState,
  observation: ProgressionObservation,
  config: WrapperProgressionConfig,
): ProgressionDecision {
  const state = copyState(prior);
  const score = Math.max(0, Math.min(1, observation.summary.progressionScore));
  state.sessionsInPhase += 1;
  state.totalSessions += 1;

  const isAExposure = observation.wrapperMode === "A";
  const isBExposure = observation.wrapperMode === "B";
  if (isAExposure) state.aScores.push(score);
  if (isBExposure) {
    state.bScores.push(score);
    state.bCurrentReference = score;
  }

  switch (prior.phase) {
    case "A_BASELINE":
      return transition(state, "A_TRAIN", "Initial Wrapper A baseline recorded.");

    case "A_TRAIN": {
      const minimumExposureMet = state.sessionsInPhase >= config.minASessions;
      const plateau = isPlateau(
        state.aScores,
        config.plateauWindow,
        config.plateauTolerance,
      );
      const maximumExposureReached =
        state.sessionsInPhase >= config.maxASessionsBeforeProbe;

      if (
        observation.dataQualityAdequate &&
        ((minimumExposureMet && plateau) || maximumExposureReached)
      ) {
        const recent = state.aScores.slice(-Math.max(1, config.plateauWindow));
        state.aPlateauReference = mean(recent);
        return transition(
          state,
          "B_INTRO",
          maximumExposureReached && !plateau
            ? "Maximum Wrapper A exposure reached; introduce Wrapper B without claiming a plateau effect."
            : "Wrapper A minimum exposure and local flattening criteria met.",
        );
      }
      return transition(state, "A_TRAIN", "Continue Wrapper A training.");
    }

    case "B_INTRO":
      return transition(state, "B_RECOVERY", "Controlled Wrapper B introduction completed.");

    case "B_RECOVERY": {
      const minimumExposureMet = state.sessionsInPhase >= config.minBSessions;
      const maximumExposureReached = state.sessionsInPhase >= config.maxBSessions;
      const recovering = isRecovering(state.bScores.slice(-config.maxBSessions));

      if (
        observation.dataQualityAdequate &&
        ((minimumExposureMet && recovering) || maximumExposureReached)
      ) {
        return transition(
          state,
          "A_RETURN",
          maximumExposureReached && !recovering
            ? "Maximum Wrapper B exposure reached; return to A to avoid trapping the user in B."
            : "Wrapper B is recovering after the minimum focused exposure.",
        );
      }
      return transition(state, "B_RECOVERY", "Continue focused Wrapper B recovery.");
    }

    case "A_RETURN":
      if (isAExposure && state.aReturnReference === undefined) {
        state.aReturnReference = score;
      }
      if (state.sessionsInPhase >= config.minAReturnBlocks) {
        return transition(
          state,
          "A_REOPEN",
          "Protected Wrapper A return completed; allow focused A re-entry before mixing.",
        );
      }
      return transition(state, "A_RETURN", "Continue protected Wrapper A return.");

    case "A_REOPEN": {
      if (isAExposure) state.aReopenScores.push(score);
      const maxReached = state.sessionsInPhase >= config.maxAReopenSessions;
      const deltaReached =
        state.aPlateauReference !== undefined &&
        config.reopenDelta !== undefined &&
        score - state.aPlateauReference >= config.reopenDelta;
      const slopeReached =
        config.reopenSlopeMin !== undefined &&
        state.aReopenScores.length >= 2 &&
        linearSlope(state.aReopenScores) >= config.reopenSlopeMin;

      if (deltaReached || slopeReached || maxReached) {
        return transition(
          state,
          "AB_MIXED",
          deltaReached
            ? "Wrapper A exceeded its pre-B local reference; begin flexible A/B practice."
            : slopeReached
              ? "Wrapper A shows a renewed positive learning trend; begin flexible A/B practice."
              : "Maximum A-reopen exposure reached; begin A/B mixing without claiming an uplift.",
        );
      }
      return transition(state, "A_REOPEN", "Continue focused Wrapper A re-entry.");
    }

    case "AB_MIXED":
      return transition(
        state,
        "AB_MAINTENANCE",
        "Initial unpredictable A/B mixed practice completed.",
      );

    case "AB_MAINTENANCE":
      return transition(state, "AB_MAINTENANCE", "Continue flexible A/B maintenance.");
  }
}
