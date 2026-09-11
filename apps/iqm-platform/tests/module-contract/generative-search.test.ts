import { describe, expect, it } from "vitest";
import { generativeSearchModule } from "../../src/modules/generative-search/module";
import { GENERATIVE_PROMPTS } from "../../src/modules/generative-search/game/prompts";
import {
  normaliseResponse,
  productProgressionSignal,
  scoreGenerativeRounds,
  type GenerativeRoundResult,
} from "../../src/modules/generative-search/game/scoring";

describe("Generative Search node contract", () => {
  it("keeps A/B as representational wrappers of the same operation", () => {
    expect(generativeSearchModule.wrappers.A.id).not.toBe(generativeSearchModule.wrappers.B.id);
    expect(generativeSearchModule.wrappers.A.invariant).toBe(
      generativeSearchModule.wrappers.B.invariant,
    );
    expect(GENERATIVE_PROMPTS.some((prompt) => prompt.family === "FLUENCY_EXTENSION")).toBe(true);
    expect(GENERATIVE_PROMPTS.some((prompt) => prompt.family === "CATEGORY_OR_PERSPECTIVE_SWITCHING")).toBe(true);
    expect(GENERATIVE_PROMPTS.some((prompt) => prompt.family === "CONSTRAINT_INVERSION_OR_REFRAMING")).toBe(true);
  });

  it("scores only deterministic component signals", () => {
    const round: GenerativeRoundResult = {
      promptId: "test",
      family: "CATEGORY_OR_PERSPECTIVE_SWITCHING",
      wrapper: "A",
      startedAtMs: 0,
      endedAtMs: 60_000,
      switchCueShownAtMs: 20_000,
      responses: [
        { text: "Move the meeting", submittedAtMs: 5_000, afterSwitchCue: false },
        { text: "move the meeting!", submittedAtMs: 10_000, afterSwitchCue: false },
        { text: "Change the room", submittedAtMs: 26_000, afterSwitchCue: true },
      ],
      commitment: "DONE",
      commitmentAtMs: 60_000,
    };
    const profile = scoreGenerativeRounds([round]);
    expect(profile.formatValidResponseCount).toBe(3);
    expect(profile.uniqueResponseCount).toBe(2);
    expect(profile.redundancyRate).toBeCloseTo(1 / 3);
    expect(profile.switchCueCompliance).toBe(1);
    expect(profile.generationRatePerMinute).toBeCloseTo(3);
    expect(normaliseResponse("  Move the meeting!!! ")).toBe("move the meeting");
    expect(productProgressionSignal(profile, 1)).toBeGreaterThan(0);
  });

  it("exposes strategy/niche content without claiming an omnibus creativity score", () => {
    expect(generativeSearchModule.strategy.handle).toContain("alternative");
    expect(generativeSearchModule.strategy.targetCues.length).toBeGreaterThan(0);
    expect(generativeSearchModule.strategy.antiCues.length).toBeGreaterThan(0);
    expect(generativeSearchModule.missions.length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(generativeSearchModule.game.getTrainingSummary())).not.toContain("creativityScore");
  });
});
