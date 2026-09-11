import { describe, expect, it } from "vitest";
import {
  CREDIBILITY_CUES,
  CREDIBILITY_SURFACE_LIMITS,
  cueAllowedOnSurface,
  credibilityCueMarkup,
} from "../../src/core/credibility/cues";

describe("shared credibility cue system", () => {
  it("exposes exactly the eight canonical cue families", () => {
    expect(Object.keys(CREDIBILITY_CUES).sort()).toEqual([
      "calibration",
      "evidence",
      "guarantee",
      "independent_check",
      "privacy",
      "protocol",
      "reviews",
      "transfer",
    ]);
  });

  it("keeps commercial trust cues out of active training", () => {
    expect(cueAllowedOnSurface("guarantee", "active_training")).toBe(false);
    expect(cueAllowedOnSurface("reviews", "active_training")).toBe(false);
    expect(CREDIBILITY_SURFACE_LIMITS.active_training).toBe(1);
  });

  it("restricts independent-check status to G Track", () => {
    expect(cueAllowedOnSurface("independent_check", "g_track")).toBe(true);
    expect(cueAllowedOnSurface("independent_check", "progress")).toBe(false);
  });

  it("renders shared icon and escaped label markup", () => {
    const markup = credibilityCueMarkup({
      cueId: "protocol",
      label: "IQM Protocol · v1.2 <test>",
    });
    expect(markup).toContain("/credibility/protocol.svg");
    expect(markup).toContain("IQM Protocol · v1.2 &lt;test&gt;");
  });
});
