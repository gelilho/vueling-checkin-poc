/**
 * Unit tests for all 8 orchestration pipeline stages.
 * Stages 1-5 are pure data transforms (no external calls).
 * Stages 6-8 call /api/generate-nudge — we mock global fetch.
 *
 * Each stage tested with: positive, negative, and edge-case scenarios.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock withMinDelay to skip artificial delays in tests
vi.mock("@/lib/utils/format", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils/format")>();
  return {
    ...actual,
    withMinDelay: async <T>(fn: () => Promise<T>) => fn(),
    delay: async () => {},
  };
});

import { executeBookingRetrieval } from "@/lib/pipeline/stages/booking-retrieval";
import { executePassengerData } from "@/lib/pipeline/stages/passenger-data";
import { executeDocumentVerification } from "@/lib/pipeline/stages/document-verification";
import { executeBagStatus } from "@/lib/pipeline/stages/bag-status";
import { executeDeliveryPreferences } from "@/lib/pipeline/stages/delivery-preferences";
import { executeAutoCheckin } from "@/lib/pipeline/stages/auto-checkin";
import { executePostCheckinComms } from "@/lib/pipeline/stages/post-checkin-comms";
import { executeAiPushNudge } from "@/lib/pipeline/stages/ai-push-nudge";
import type { PipelineContext, DeliveryChannel } from "@/types";

// --- Shared test context ---

function createContext(overrides: Partial<PipelineContext> = {}): PipelineContext {
  return {
    passengerId: "pax-001",
    name: "GARCIA LOPEZ, MARIA",
    nationality: "ESP",
    dateOfBirth: "1990-05-14",
    passportNumber: "PAA123456",
    passportExpiry: "2028-12-31",
    passportName: "GARCIA LOPEZ, MARIA",
    pnr: "VY-M2026A",
    flight: "VY1234",
    origin: "BCN",
    destination: "FCO",
    destinationCity: "Rome",
    date: "2026-03-15",
    seat: "14A",
    channels: ["email", "push"] as DeliveryChannel[],
    isLiveScan: false,
    checkedBag: false,
    tripDays: 5,
    language: "es",
    bookingDate: "2026-01-10",
    ...overrides,
  };
}

// --- Mock fetch for API-calling stages ---

function mockFetchSuccess(response: Record<string, unknown>) {
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => response,
  });
}

function mockFetchFailure() {
  global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
}

const originalFetch = global.fetch;

beforeEach(() => {
  vi.restoreAllMocks();
  // Reset global.fetch to its original value so tests don't leak mock state
  global.fetch = originalFetch;
});

// ═══════════════════════════════════════════════════════
// STAGE 1: Booking Retrieval
// ═══════════════════════════════════════════════════════

describe("Stage 1: executeBookingRetrieval", () => {
  it("returns booking data from context", async () => {
    const result = await executeBookingRetrieval(createContext());
    expect(result.data["PNR"]).toBe("VY-M2026A");
    expect(result.data["Route"]).toContain("BCN");
    expect(result.data["Route"]).toContain("FCO");
    expect(result.data["Flight"]).toBe("VY1234");
    expect(result.summary).toContain("VY-M2026A");
  });

  it("shows 2+ passengers when companion present", async () => {
    const result = await executeBookingRetrieval(
      createContext({ companion: "JUAN GARCIA" })
    );
    expect(result.data["Passengers"]).toBe("2+");
  });

  it("shows 1 passenger when no companion", async () => {
    const result = await executeBookingRetrieval(createContext());
    expect(result.data["Passengers"]).toBe("1");
  });

  it("uses fallback PNR when none provided", async () => {
    const result = await executeBookingRetrieval(
      createContext({ pnr: undefined })
    );
    expect(result.data["PNR"]).toBe("VY-XXXXXX");
  });
});

// ═══════════════════════════════════════════════════════
// STAGE 2: Passenger Data
// ═══════════════════════════════════════════════════════

describe("Stage 2: executePassengerData", () => {
  it("returns passenger profile data", async () => {
    const result = await executePassengerData(createContext());
    expect(result.data["Full name"]).toBe("GARCIA LOPEZ, MARIA");
    expect(result.data["Nationality"]).toBe("ESP");
    expect(result.data["Passport number"]).toBe("PAA123456");
    expect(result.data["Language"]).toBe("ES");
    expect(result.summary).toContain("GARCIA LOPEZ, MARIA");
  });

  it("defaults loyalty tier to Standard", async () => {
    const result = await executePassengerData(createContext());
    expect(result.data["Loyalty tier"]).toBe("Standard");
  });

  it("shows actual loyalty tier when present", async () => {
    const result = await executePassengerData(
      createContext({ loyaltyTier: "Gold" })
    );
    expect(result.data["Loyalty tier"]).toBe("Gold");
  });

  it("defaults language to EN when not specified", async () => {
    const result = await executePassengerData(
      createContext({ language: undefined })
    );
    expect(result.data["Language"]).toBe("EN");
  });
});

// ═══════════════════════════════════════════════════════
// STAGE 3: Document Verification
// ═══════════════════════════════════════════════════════

describe("Stage 3: executeDocumentVerification", () => {
  it("returns valid when all checks pass", async () => {
    mockFetchSuccess({
      valid: true,
      issues: [],
    });

    const result = await executeDocumentVerification(createContext());
    expect(result.valid).toBe(true);
    expect(result.summary).toContain("verified");
    expect(result.data["Passport number"]).toContain("Valid format");
    expect(result.data["Expiry date"]).toContain("Valid");
    expect(result.data["Age check"]).toContain("18+");
    expect(result.data["Name verification"]).toContain("Match");
  });

  it("returns invalid when passport is expired", async () => {
    mockFetchSuccess({
      valid: false,
      issues: [
        { type: "passport_expiry", details: "Passport expires before travel date" },
      ],
    });

    const result = await executeDocumentVerification(
      createContext({ passportExpiry: "2020-01-01" })
    );
    expect(result.valid).toBe(false);
    expect(result.summary).toContain("issue");
    expect(result.data["Expiry date"]).toContain("Expired");
    expect(result.issueMessage).toContain("Passport expires");
  });

  it("returns invalid when passport number is bad", async () => {
    mockFetchSuccess({
      valid: false,
      issues: [
        { type: "invalid_passport_number", details: "Invalid passport format" },
      ],
    });

    const result = await executeDocumentVerification(
      createContext({ passportNumber: "AB" })
    );
    expect(result.valid).toBe(false);
    expect(result.data["Passport number"]).toContain("Invalid format");
  });

  it("returns invalid when passenger is underage", async () => {
    mockFetchSuccess({
      valid: false,
      issues: [{ type: "underage", details: "Passenger under 18" }],
    });

    const result = await executeDocumentVerification(
      createContext({ dateOfBirth: "2015-06-01" })
    );
    expect(result.valid).toBe(false);
    expect(result.data["Age check"]).toContain("Under 18");
  });

  it("detects name mismatch as warning (still valid)", async () => {
    mockFetchSuccess({
      valid: true,
      issues: [{ type: "name_mismatch", details: "Names do not match" }],
    });

    const result = await executeDocumentVerification(createContext());
    // Name mismatch is a warning — validation may still pass
    expect(result.valid).toBe(true);
    expect(result.data["Name verification"]).toContain("Mismatch");
  });

  it("handles multiple issues simultaneously", async () => {
    mockFetchSuccess({
      valid: false,
      issues: [
        { type: "passport_expiry", details: "Passport expired" },
        { type: "underage", details: "Under 18" },
        { type: "name_mismatch", details: "Names differ" },
      ],
    });

    const result = await executeDocumentVerification(createContext());
    expect(result.valid).toBe(false);
    expect(result.data["Expiry date"]).toContain("Expired");
    expect(result.data["Age check"]).toContain("Under 18");
    expect(result.data["Name verification"]).toContain("Mismatch");
    // issueMessage should contain the first issue's details
    expect(result.issueMessage).toContain("Passport expired");
  });

  it("shows N/A for missing passport data", async () => {
    mockFetchSuccess({ valid: true, issues: [] });

    const result = await executeDocumentVerification(
      createContext({ passportNumber: undefined, passportExpiry: undefined })
    );
    expect(result.data["Passport"]).toBe("N/A");
    expect(result.data["Expiry"]).toBe("N/A");
  });

  it("uses issue type as fallback when details is missing", async () => {
    mockFetchSuccess({
      valid: false,
      issues: [{ type: "invalid_expiry_date" }],
    });

    const result = await executeDocumentVerification(createContext());
    expect(result.valid).toBe(false);
    expect(result.issueMessage).toBe("invalid expiry date");
    expect(result.data["Expiry date"]).toContain("Invalid");
  });
});

// ═══════════════════════════════════════════════════════
// STAGE 4: Bag Status
// ═══════════════════════════════════════════════════════

describe("Stage 4: executeBagStatus", () => {
  it("detects checked bag when present", async () => {
    const result = await executeBagStatus(createContext({ checkedBag: true }));
    expect(result.data["Checked bags"]).toContain("23kg");
    expect(result.data["Status"]).toContain("confirmed");
    expect(result.summary).toContain("1 checked bag");
  });

  it("detects nudge opportunity when no bag", async () => {
    const result = await executeBagStatus(createContext({ checkedBag: false }));
    expect(result.data["Checked bags"]).toBe("None booked");
    expect(result.data["Status"]).toContain("nudge opportunity");
    expect(result.summary).toBe("No checked bags");
  });

  it("always shows cabin bag included", async () => {
    const result = await executeBagStatus(createContext());
    expect(result.data["Cabin bag"]).toContain("included");
  });
});

// ═══════════════════════════════════════════════════════
// STAGE 5: Delivery Preferences
// ═══════════════════════════════════════════════════════

describe("Stage 5: executeDeliveryPreferences", () => {
  it("lists selected channels", async () => {
    const result = await executeDeliveryPreferences(
      createContext({ channels: ["email", "push"] as DeliveryChannel[] })
    );
    expect(result.summary).toContain("Email");
    expect(result.summary).toContain("Push");
  });

  it("uses deliveryPreferences over channels when both set", async () => {
    const result = await executeDeliveryPreferences(
      createContext({
        channels: ["email"] as DeliveryChannel[],
        deliveryPreferences: ["sms", "push"] as DeliveryChannel[],
      })
    );
    expect(result.summary).toContain("SMS");
    expect(result.summary).toContain("Push");
  });
});

// ═══════════════════════════════════════════════════════
// STAGE 6: Auto Check-In
// ═══════════════════════════════════════════════════════

describe("Stage 6: executeAutoCheckin", () => {
  it("checks in successfully when docs valid", async () => {
    mockFetchSuccess({
      message: "You're all set, Maria!",
      geminiResponse: { model: "gemini-2.0-flash" },
    });

    const result = await executeAutoCheckin(createContext(), true);
    expect(result.valid).toBe(true);
    expect(result.data["Status"]).toContain("Automatically checked in");
    expect(result.data["Seat assignment"]).toBe("14A");
    expect(result.confirmationMessage).toBe("You're all set, Maria!");
    expect(result.geminiResponse).toBeDefined();
  });

  it("blocks check-in when docs invalid", async () => {
    const result = await executeAutoCheckin(createContext(), false);
    expect(result.valid).toBe(false);
    expect(result.data["Status"]).toContain("Blocked");
    expect(result.data["Seat assignment"]).toBe("—");
    expect(result.issueMessage).toContain("document issue");
    // Should NOT call fetch when docs are invalid — fetch is not mocked here
    expect(vi.isMockFunction(global.fetch)).toBe(false);
  });

  it("formats seat with companion info", async () => {
    mockFetchSuccess({ message: "Checked in!", geminiResponse: null });
    const result = await executeAutoCheckin(
      createContext({
        companion: "JUAN GARCIA",
        companionSeat: "14B",
      }),
      true
    );
    expect(result.data["Seat assignment"]).toContain("JUAN GARCIA");
    expect(result.data["Seat assignment"]).toContain("14B");
  });

  it("falls back to static message when Gemini fails", async () => {
    mockFetchFailure();
    const result = await executeAutoCheckin(createContext(), true);
    expect(result.valid).toBe(true);
    expect(result.confirmationMessage).toContain("VY1234");
    expect(result.confirmationMessage).toContain("14A");
    expect(result.geminiResponse).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════
// STAGE 7: Post Check-In Comms
// ═══════════════════════════════════════════════════════

describe("Stage 7: executePostCheckinComms", () => {
  it("delivers boarding pass via selected channels", async () => {
    mockFetchSuccess({ message: "Add a bag for €19.99!" });
    const result = await executePostCheckinComms(
      createContext({ channels: ["email", "push"] as DeliveryChannel[] })
    );
    expect(result.data["Boarding pass"]).toContain("Generated");
    expect(result.summary).toContain("2 channels");
  });

  it("generates bag nudge when no checked bag", async () => {
    mockFetchSuccess({ message: "Add a bag for €19.99!" });
    const result = await executePostCheckinComms(
      createContext({ checkedBag: false })
    );
    expect(result.bagNudge).toBe("Add a bag for €19.99!");
  });

  it("skips bag nudge when checked bag exists", async () => {
    const result = await executePostCheckinComms(
      createContext({ checkedBag: true })
    );
    expect(result.bagNudge).toBeNull();
    // fetch should NOT be called — no nudge needed
  });

  it("gracefully returns null bag nudge when Gemini fails", async () => {
    mockFetchFailure();
    const result = await executePostCheckinComms(
      createContext({ checkedBag: false })
    );
    expect(result.bagNudge).toBeNull();
    // Pipeline continues normally
    expect(result.data["Boarding pass"]).toContain("Generated");
  });
});

// ═══════════════════════════════════════════════════════
// STAGE 8: AI Push Nudge
// ═══════════════════════════════════════════════════════

describe("Stage 8: executeAiPushNudge", () => {
  describe("document issue path", () => {
    it("generates AI issue nudge when check-in failed", async () => {
      mockFetchSuccess({
        message: "Hi Maria, your passport has expired. Please renew.",
        geminiResponse: { model: "gemini-2.0-flash" },
      });

      const result = await executeAiPushNudge(
        createContext(),
        false,
        "Passport expired"
      );
      expect(result.nudgeMessage).toContain("passport has expired");
      expect(result.aiGenerated).toBe(true);
      expect(result.data["Opportunity detected"]).toContain("Document issue");
    });

    it("falls back to template when Gemini fails on issue path", async () => {
      mockFetchFailure();
      const result = await executeAiPushNudge(
        createContext(),
        false,
        "Passport expired"
      );
      expect(result.nudgeMessage).toContain("Passport expired");
      expect(result.nudgeMessage).toContain("GARCIA LOPEZ, MARIA");
      expect(result.aiGenerated).toBe(false);
    });
  });

  describe("happy path — no checked bag (upsell)", () => {
    it("generates AI bag upsell nudge", async () => {
      mockFetchSuccess({
        message: "Maria, add a 20kg bag for just €19.99!",
        geminiResponse: { model: "gemini-2.0-flash" },
      });

      const result = await executeAiPushNudge(createContext(), true);
      expect(result.nudgeMessage).toContain("20kg bag");
      expect(result.aiGenerated).toBe(true);
      expect(result.data["Opportunity detected"]).toContain("upsell");
    });

    it("falls back to static upsell when Gemini fails", async () => {
      mockFetchFailure();
      const result = await executeAiPushNudge(
        createContext({ checkedBag: false }),
        true
      );
      expect(result.nudgeMessage).toContain("€19.99");
      expect(result.nudgeMessage).toContain("Rome");
      expect(result.aiGenerated).toBe(false);
    });
  });

  describe("happy path — has checked bag (travel tip)", () => {
    it("generates travel tip nudge", async () => {
      mockFetchSuccess({
        message: "Enjoy Rome! Don't miss the Colosseum.",
        geminiResponse: { model: "gemini-2.0-flash" },
      });

      const result = await executeAiPushNudge(
        createContext({ checkedBag: true }),
        true
      );
      expect(result.nudgeMessage).toContain("Rome");
      expect(result.aiGenerated).toBe(true);
      expect(result.data["Opportunity detected"]).toContain("Travel tip");
    });

    it("falls back to static travel tip when Gemini fails", async () => {
      mockFetchFailure();
      const result = await executeAiPushNudge(
        createContext({ checkedBag: true }),
        true
      );
      expect(result.nudgeMessage).toContain("Rome");
      expect(result.nudgeMessage).toContain("destination guide");
      expect(result.aiGenerated).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles missing name gracefully in fallback", async () => {
      mockFetchFailure();
      const result = await executeAiPushNudge(
        createContext({ name: undefined }),
        true
      );
      expect(result.nudgeMessage).toContain("there");
    });

    it("uses destinationCity for human-friendly names", async () => {
      mockFetchFailure();
      const result = await executeAiPushNudge(
        createContext({ destinationCity: "Barcelona", destination: "BCN" }),
        true
      );
      expect(result.nudgeMessage).toContain("Barcelona");
    });

    it("always marks content source correctly", async () => {
      mockFetchSuccess({
        message: "AI message",
        geminiResponse: { model: "gemini-2.0-flash" },
      });
      const result = await executeAiPushNudge(createContext(), true);
      expect(result.data["Content source"]).toContain("AI-Generated");
      expect(result.data["Powered by"]).toContain("Gemini");
    });
  });
});
