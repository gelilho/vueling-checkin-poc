/**
 * Unit tests for lib/utils (string, format).
 * Covers: levenshtein, isFuzzyMatch, fillTemplate, formatDuration, delay, withMinDelay.
 */

import { describe, it, expect } from "vitest";
import {
  levenshtein,
  isFuzzyMatch,
  fillTemplate,
  stripDataUrlPrefix,
} from "@/lib/utils/string";
import { formatDuration, delay, withMinDelay } from "@/lib/utils/format";

// ─── String utilities ───

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("abc", "abc")).toBe(0);
  });

  it("returns correct distance for single edit", () => {
    expect(levenshtein("abc", "adc")).toBe(1);
  });

  it("returns correct distance for insertion", () => {
    expect(levenshtein("abc", "abcd")).toBe(1);
  });

  it("returns correct distance for deletion", () => {
    expect(levenshtein("abcd", "abc")).toBe(1);
  });

  it("returns full length for completely different strings", () => {
    expect(levenshtein("abc", "xyz")).toBe(3);
  });

  it("handles empty strings", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
    expect(levenshtein("", "")).toBe(0);
  });
});

describe("isFuzzyMatch", () => {
  it("matches identical strings", () => {
    expect(isFuzzyMatch("MARIA", "MARIA")).toBe(true);
  });

  it("matches with 1 char difference (threshold=1)", () => {
    expect(isFuzzyMatch("MARIA", "MARYA")).toBe(true);
  });

  it("does NOT match with 2+ char difference", () => {
    expect(isFuzzyMatch("MARIA", "MARKO")).toBe(false);
  });
});

describe("fillTemplate", () => {
  it("replaces {{key}} placeholders", () => {
    const result = fillTemplate("Hello {{name}}, flight {{flight}}.", {
      name: "Maria",
      flight: "VY1234",
    });
    expect(result).toBe("Hello Maria, flight VY1234.");
  });

  it("replaces multiple occurrences of the same key", () => {
    const result = fillTemplate("{{x}} and {{x}}", { x: "A" });
    expect(result).toBe("A and A");
  });

  it("leaves unmatched keys untouched", () => {
    const result = fillTemplate("Hello {{name}}", {});
    expect(result).toBe("Hello {{name}}");
  });
});

describe("stripDataUrlPrefix", () => {
  it("removes data:image/ prefix", () => {
    expect(stripDataUrlPrefix("data:image/png;base64,ABC")).toBe("ABC");
    expect(stripDataUrlPrefix("data:image/jpeg;base64,XYZ")).toBe("XYZ");
  });

  it("returns raw string when no prefix", () => {
    expect(stripDataUrlPrefix("RAWBASE64")).toBe("RAWBASE64");
  });
});

// ─── Format utilities ───

describe("formatDuration", () => {
  it("formats milliseconds as seconds string", () => {
    expect(formatDuration(1200)).toBe("1.2s");
    expect(formatDuration(500)).toBe("0.5s");
    expect(formatDuration(12345)).toBe("12.3s");
  });
});

describe("delay", () => {
  it("resolves after the specified time", async () => {
    const start = Date.now();
    await delay(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40); // allow 10ms tolerance
  });
});

describe("withMinDelay", () => {
  it("enforces minimum delay", async () => {
    const start = Date.now();
    const result = await withMinDelay(async () => "fast", 100);
    const elapsed = Date.now() - start;
    expect(result).toBe("fast");
    expect(elapsed).toBeGreaterThanOrEqual(90); // allow 10ms tolerance
  });

  it("does not add delay if function takes longer than minimum", async () => {
    const start = Date.now();
    const result = await withMinDelay(async () => {
      await delay(100);
      return "slow";
    }, 50);
    const elapsed = Date.now() - start;
    expect(result).toBe("slow");
    expect(elapsed).toBeGreaterThanOrEqual(90);
    expect(elapsed).toBeLessThan(200);
  });
});
