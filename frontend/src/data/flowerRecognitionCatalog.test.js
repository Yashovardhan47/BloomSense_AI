import { describe, expect, it } from "vitest";

import { FLOWER_RECOGNITION_CATALOG, findFlowerByName, findFlowerBySlug } from "./flowerRecognitionCatalog";

describe("flower recognition catalogue", () => {
  it("contains 67 distinct flower groups", () => {
    expect(FLOWER_RECOGNITION_CATALOG).toHaveLength(67);
    expect(new Set(FLOWER_RECOGNITION_CATALOG.map((item) => item.slug)).size).toBe(67);
  });

  it("finds common, scientific, and alias names without a Rose fallback", () => {
    expect(findFlowerByName("Nelumbo nucifera")?.slug).toBe("lotus");
    expect(findFlowerByName("sun flower")?.slug).toBe("sunflower");
    expect(findFlowerByName("not a known flower")).toBeNull();
    expect(findFlowerBySlug("orchid")?.common_name).toBe("Moth orchid");
  });
});
