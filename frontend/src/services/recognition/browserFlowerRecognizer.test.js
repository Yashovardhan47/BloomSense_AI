import { describe, expect, it } from "vitest";

import { interpretPredictions } from "./browserFlowerRecognizer";

const flowerGate = [
  { label: "a clear photograph containing a visible flower in bloom", score: 0.94 },
  { label: "a plant photograph showing leaves but no visible flower", score: 0.04 },
  { label: "a photograph of something that is not a flower or plant", score: 0.02 },
];

describe("browser recognition interpretation", () => {
  it("uses the strongest catalogue match rather than a fixed species", () => {
    const result = interpretPredictions([
      { label: "a clear close-up photograph of a sunflower flower in bloom", score: 0.61 },
      { label: "a clear close-up photograph of a rose flower in bloom", score: 0.09 },
      { label: "a clear close-up photograph of a tulip flower in bloom", score: 0.08 },
    ], flowerGate);
    expect(result.slug).toBe("sunflower");
    expect(result.confidence).toBe(0.61);
  });

  it("rejects a scene when the flower gate loses", () => {
    expect(() => interpretPredictions([], [
      { label: flowerGate[0].label, score: 0.12 },
      { label: "a photograph of something that is not a flower or plant", score: 0.82 },
    ])).toThrow(/No clear flower/);
  });

  it("requires review when two visual candidates are close", () => {
    const result = interpretPredictions([
      { label: "a clear close-up photograph of a sacred lotus flower in bloom", score: 0.19 },
      { label: "a clear close-up photograph of a water lily flower in bloom", score: 0.18 },
    ], flowerGate);
    expect(result.slug).toBe("lotus");
    expect(result.needs_confirmation).toBe(true);
    expect(result.alternatives[0].slug).toBe("water-lily");
  });
});
