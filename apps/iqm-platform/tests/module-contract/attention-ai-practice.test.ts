import { describe, expect, it } from "vitest";
import {
  ATTENTION_AI_CHECK_CASE,
  ATTENTION_AI_PRACTICE_CASE,
  signalSelectionScore,
} from "../../src/modules/attention/aiPractice";

describe("Attention Find the Signal AI practice", () => {
  it("contains a disclosed fallible AI shortlist", () => {
    const suggestion = new Set(ATTENTION_AI_PRACTICE_CASE.aiSuggestion ?? []);
    const score = signalSelectionScore(ATTENTION_AI_PRACTICE_CASE, suggestion);
    expect(score.falsePositives).toBeGreaterThan(0);
    expect(score.misses).toBeGreaterThan(0);
  });

  it("scores exact human relevance selection independently", () => {
    const correct = new Set(
      ATTENTION_AI_CHECK_CASE.items.filter((item) => item.relevant).map((item) => item.id),
    );
    expect(signalSelectionScore(ATTENTION_AI_CHECK_CASE, correct)).toEqual({
      hits: 3,
      falsePositives: 0,
      misses: 0,
      exact: true,
    });
  });
});
