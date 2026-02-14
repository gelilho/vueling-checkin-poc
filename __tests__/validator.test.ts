/**
 * Unit tests for lib/validator.ts
 * Covers: passport format, expiry, DOB/age, name matching, route-specific checks.
 */

import { describe, it, expect } from "vitest";
import { validatePassenger } from "@/lib/validator";

// --- Helpers ---

const VALID_DEFAULTS = {
  passportExpiry: "2028-12-31",
  nationality: "ESP",
  passportName: "GARCIA LOPEZ, MARIA",
  bookingName: "MARIA GARCIA LOPEZ",
  destination: "FCO",
  travelDate: "2026-03-15",
  passportNumber: "PAA123456",
  dateOfBirth: "1990-05-14",
};

function validate(overrides: Partial<typeof VALID_DEFAULTS> = {}) {
  const d = { ...VALID_DEFAULTS, ...overrides };
  return validatePassenger(
    d.passportExpiry,
    d.nationality,
    d.passportName,
    d.bookingName,
    d.destination,
    d.travelDate,
    d.passportNumber,
    d.dateOfBirth
  );
}

// ─── Tests ───

describe("validatePassenger", () => {
  describe("happy path", () => {
    it("returns valid for a correct passenger", () => {
      const result = validate();
      expect(result.valid).toBe(true);
      const errors = result.issues.filter((i) => i.severity === "error");
      expect(errors).toHaveLength(0);
    });
  });

  describe("passport number format", () => {
    it("accepts valid passport number (alphanumeric 5-12)", () => {
      const result = validate({ passportNumber: "AB1234567" });
      expect(result.issues.find((i) => i.type === "invalid_passport_number")).toBeUndefined();
    });

    it("accepts valid DNI format (8 digits + letter)", () => {
      const result = validate({ passportNumber: "12345678Z" });
      expect(result.issues.find((i) => i.type === "invalid_passport_number")).toBeUndefined();
    });

    it("accepts valid NIE format (X/Y/Z + 7 digits + letter)", () => {
      const result = validate({ passportNumber: "X1234567A" });
      expect(result.issues.find((i) => i.type === "invalid_passport_number")).toBeUndefined();
    });

    it("rejects invalid passport number (too short)", () => {
      const result = validate({ passportNumber: "AB" });
      expect(result.valid).toBe(false);
      expect(result.issues.find((i) => i.type === "invalid_passport_number")).toBeDefined();
    });

    it("rejects passport with special characters", () => {
      const result = validate({ passportNumber: "AB@#$%^" });
      expect(result.valid).toBe(false);
      expect(result.issues.find((i) => i.type === "invalid_passport_number")).toBeDefined();
    });
  });

  describe("expiry date", () => {
    it("accepts passport with sufficient validity", () => {
      const result = validate({ passportExpiry: "2030-01-01" });
      expect(result.issues.find((i) => i.type === "passport_expiry")).toBeUndefined();
    });

    it("rejects expired passport", () => {
      const result = validate({ passportExpiry: "2020-01-01" });
      expect(result.valid).toBe(false);
      expect(result.issues.find((i) => i.type === "passport_expiry")).toBeDefined();
    });

    it("rejects invalid expiry date string", () => {
      const result = validate({ passportExpiry: "not-a-date" });
      expect(result.valid).toBe(false);
      expect(result.issues.find((i) => i.type === "invalid_expiry_date")).toBeDefined();
    });

    it("rejects empty expiry", () => {
      const result = validate({ passportExpiry: "" });
      expect(result.valid).toBe(false);
      expect(result.issues.find((i) => i.type === "invalid_expiry_date")).toBeDefined();
    });
  });

  describe("date of birth and age", () => {
    it("accepts passenger aged 18+", () => {
      const result = validate({ dateOfBirth: "2000-01-01" });
      expect(result.issues.find((i) => i.type === "underage")).toBeUndefined();
    });

    it("rejects passenger under 18", () => {
      const result = validate({ dateOfBirth: "2015-06-01" });
      expect(result.valid).toBe(false);
      expect(result.issues.find((i) => i.type === "underage")).toBeDefined();
    });

    it("rejects invalid date of birth", () => {
      const result = validate({ dateOfBirth: "invalid-dob" });
      expect(result.valid).toBe(false);
      expect(result.issues.find((i) => i.type === "invalid_dob")).toBeDefined();
    });

    it("handles edge case: passenger turns 18 on travel date", () => {
      const result = validate({
        dateOfBirth: "2008-03-15",
        travelDate: "2026-03-15",
      });
      expect(result.issues.find((i) => i.type === "underage")).toBeUndefined();
    });

    it("rejects passenger who turns 18 day after travel", () => {
      const result = validate({
        dateOfBirth: "2008-03-16",
        travelDate: "2026-03-15",
      });
      expect(result.valid).toBe(false);
      expect(result.issues.find((i) => i.type === "underage")).toBeDefined();
    });
  });

  describe("name matching", () => {
    it("matches identical names", () => {
      const result = validate({
        passportName: "GARCIA LOPEZ, MARIA",
        bookingName: "MARIA GARCIA LOPEZ",
      });
      expect(result.issues.find((i) => i.type === "name_mismatch")).toBeUndefined();
    });

    it("allows fuzzy match (1 char difference)", () => {
      const result = validate({
        passportName: "GARCIA LOPEZ, MARYA",
        bookingName: "MARIA GARCIA LOPEZ",
      });
      expect(result.issues.find((i) => i.type === "name_mismatch")).toBeUndefined();
    });

    it("warns on clear mismatch", () => {
      const result = validate({
        passportName: "SMITH, JOHN",
        bookingName: "MARIA GARCIA LOPEZ",
      });
      expect(result.issues.find((i) => i.type === "name_mismatch")).toBeDefined();
      // Name mismatch is a warning, not an error — should still be valid
      expect(result.issues.find((i) => i.type === "name_mismatch")?.severity).toBe("warning");
    });
  });

  describe("unknown destination (no route data)", () => {
    it("validates basic checks even without route data", () => {
      const result = validate({ destination: "ZZZ" });
      expect(result.valid).toBe(true);
    });

    it("still catches expired passport without route data", () => {
      const result = validate({ destination: "ZZZ", passportExpiry: "not-a-date" });
      expect(result.valid).toBe(false);
    });
  });

  describe("multiple issues", () => {
    it("catches expired passport AND underage", () => {
      const result = validate({
        passportExpiry: "2020-01-01",
        dateOfBirth: "2015-01-01",
      });
      expect(result.valid).toBe(false);
      expect(result.issues.filter((i) => i.severity === "error").length).toBeGreaterThanOrEqual(2);
    });
  });
});
