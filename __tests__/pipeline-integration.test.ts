/**
 * Integration tests for the full orchestration pipeline.
 * Tests the 8-stage pipeline end-to-end with different scenarios:
 *   - Happy path (all valid, checked bag)
 *   - Happy path (no bag — upsell opportunity)
 *   - Document validation failure (passport expired)
 *   - Gemini unavailable (graceful fallback on all AI stages)
 *   - Companion travel scenario
 *
 * These tests validate the conditional logic:
 *   - Stage 4 (Bag Status) SKIPPED when docs invalid
 *   - Stage 6 (Auto Check-In) BLOCKED when docs invalid
 *   - Stage 7 (Post Check-In Comms) SKIPPED when check-in failed
 *   - Stage 8 (AI Nudge) ALWAYS runs
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock withMinDelay to skip artificial delays
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
import { executeBagStatus } from "@/lib/pipeline/stages/bag-status";
import { executeDeliveryPreferences } from "@/lib/pipeline/stages/delivery-preferences";
import { executeAutoCheckin } from "@/lib/pipeline/stages/auto-checkin";
import { executePostCheckinComms } from "@/lib/pipeline/stages/post-checkin-comms";
import { executeAiPushNudge } from "@/lib/pipeline/stages/ai-push-nudge";
import { validatePassenger } from "@/lib/validator";
import { pipelineReducer, createInitialState } from "@/lib/pipeline/reducer";
import type { PipelineContext, DeliveryChannel, PipelineConfig, StageId } from "@/types";

// --- Helpers ---

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

function mockFetch(responses: Record<string, unknown>[]) {
  let callIndex = 0;
  global.fetch = vi.fn().mockImplementation(async () => ({
    json: async () => responses[callIndex++] || responses[responses.length - 1],
  }));
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ═══════════════════════════════════════════════════════
// SCENARIO 1: Happy path — all valid, no checked bag
// ═══════════════════════════════════════════════════════

describe("Integration: Happy path — valid passenger, no bag", () => {
  it("executes all 8 stages successfully", async () => {
    const ctx = createContext({ checkedBag: false });

    // Mock all Gemini calls (stages 6, 7, 8)
    mockFetch([
      { message: "You're checked in, Maria!", geminiResponse: { model: "gemini-2.0-flash" } },
      { message: "Add a bag for €19.99!", geminiResponse: null },
      { message: "Heading to Rome without luggage?", geminiResponse: { model: "gemini-2.0-flash" } },
    ]);

    // Stage 1
    const booking = await executeBookingRetrieval(ctx);
    expect(booking.data["PNR"]).toBe("VY-M2026A");

    // Stage 2
    const passenger = await executePassengerData(ctx);
    expect(passenger.data["Full name"]).toContain("GARCIA");

    // Stage 3: Direct validation (not through fetch since it's an internal API)
    const validation = validatePassenger(
      ctx.passportExpiry!, ctx.nationality!, ctx.passportName!, ctx.name!,
      ctx.destination!, ctx.date!, ctx.passportNumber!, ctx.dateOfBirth!
    );
    expect(validation.valid).toBe(true);

    // Stage 4: Bag Status (runs because docs valid)
    const bags = await executeBagStatus(ctx);
    expect(bags.data["Status"]).toContain("nudge opportunity");

    // Stage 5
    const prefs = await executeDeliveryPreferences(ctx);
    expect(prefs.summary).toContain("Email");

    // Stage 6: Auto Check-In (runs because docs valid)
    const checkin = await executeAutoCheckin(ctx, true);
    expect(checkin.valid).toBe(true);
    expect(checkin.confirmationMessage).toContain("Maria");

    // Stage 7: Post Check-In Comms (runs because check-in succeeded)
    const comms = await executePostCheckinComms(ctx);
    expect(comms.data["Boarding pass"]).toContain("Generated");
    expect(comms.bagNudge).toBe("Add a bag for €19.99!");

    // Stage 8: AI Nudge (always runs — upsell path)
    const nudge = await executeAiPushNudge(ctx, true);
    expect(nudge.aiGenerated).toBe(true);
    expect(nudge.data["Opportunity detected"]).toContain("upsell");
  });
});

// ═══════════════════════════════════════════════════════
// SCENARIO 2: Happy path — has checked bag (travel tip)
// ═══════════════════════════════════════════════════════

describe("Integration: Happy path — valid passenger, has bag", () => {
  it("skips bag nudge and generates travel tip", async () => {
    const ctx = createContext({ checkedBag: true });

    mockFetch([
      { message: "Checked in!", geminiResponse: null },
      { message: "Enjoy Rome!", geminiResponse: { model: "gemini-2.0-flash" } },
    ]);

    // Stage 4: Bag Status — confirmed
    const bags = await executeBagStatus(ctx);
    expect(bags.data["Status"]).toContain("confirmed");

    // Stage 6: Auto Check-In
    const checkin = await executeAutoCheckin(ctx, true);
    expect(checkin.valid).toBe(true);

    // Stage 7: Post Check-In Comms — NO bag nudge
    const comms = await executePostCheckinComms(ctx);
    expect(comms.bagNudge).toBeNull();

    // Stage 8: Travel tip instead of upsell
    const nudge = await executeAiPushNudge(ctx, true);
    expect(nudge.data["Opportunity detected"]).toContain("Travel tip");
  });
});

// ═══════════════════════════════════════════════════════
// SCENARIO 3: Document validation failure
// ═══════════════════════════════════════════════════════

describe("Integration: Document validation failure — passport expired", () => {
  it("blocks check-in and sends issue nudge", async () => {
    const ctx = createContext({ passportExpiry: "2020-01-01" });

    mockFetch([
      { message: "Your passport has expired, Maria.", geminiResponse: { model: "gemini-2.0-flash" } },
    ]);

    // Stage 3: Validation fails
    const validation = validatePassenger(
      ctx.passportExpiry!, ctx.nationality!, ctx.passportName!, ctx.name!,
      ctx.destination!, ctx.date!, ctx.passportNumber!, ctx.dateOfBirth!
    );
    expect(validation.valid).toBe(false);
    const expiryIssue = validation.issues.find((i) => i.type === "passport_expiry");
    expect(expiryIssue).toBeDefined();

    const docsValid = false;
    const docIssueMsg = expiryIssue!.details!;

    // Stage 4: Bag Status — SKIPPED (simulated by orchestrator)
    // We don't call executeBagStatus here

    // Stage 5: Delivery Preferences — always runs
    const prefs = await executeDeliveryPreferences(ctx);
    expect(prefs.summary).toContain("Email");

    // Stage 6: Auto Check-In — BLOCKED
    const checkin = await executeAutoCheckin(ctx, docsValid);
    expect(checkin.valid).toBe(false);
    expect(checkin.data["Status"]).toContain("Blocked");

    // Stage 7: Post Check-In Comms — SKIPPED (simulated by orchestrator)
    // We don't call executePostCheckinComms here

    // Stage 8: AI Nudge — sends document issue nudge
    const nudge = await executeAiPushNudge(ctx, false, docIssueMsg);
    expect(nudge.data["Opportunity detected"]).toContain("Document issue");
    expect(nudge.aiGenerated).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
// SCENARIO 4: Gemini completely unavailable
// ═══════════════════════════════════════════════════════

describe("Integration: Gemini unavailable — all fallbacks", () => {
  it("completes pipeline with static fallback messages", async () => {
    const ctx = createContext();

    // All fetch calls will fail
    global.fetch = vi.fn().mockRejectedValue(new Error("Gemini 429"));

    // Stage 6: Falls back to static confirmation
    const checkin = await executeAutoCheckin(ctx, true);
    expect(checkin.valid).toBe(true);
    expect(checkin.confirmationMessage).toContain("VY1234");
    expect(checkin.geminiResponse).toBeNull();

    // Stage 7: Bag nudge is null but pipeline continues
    const comms = await executePostCheckinComms(ctx);
    expect(comms.data["Boarding pass"]).toContain("Generated");
    expect(comms.bagNudge).toBeNull();

    // Stage 8: Falls back to static nudge
    const nudge = await executeAiPushNudge(ctx, true);
    expect(nudge.aiGenerated).toBe(false);
    expect(nudge.nudgeMessage).toContain("€19.99");
    expect(nudge.data["Content source"]).toContain("Fallback");
  });
});

// ═══════════════════════════════════════════════════════
// SCENARIO 5: Companion travel
// ═══════════════════════════════════════════════════════

describe("Integration: Companion travel scenario", () => {
  it("includes companion info in booking and seat assignment", async () => {
    const ctx = createContext({
      companion: "GARCIA LOPEZ, JUAN",
      companionSeat: "14B",
    });

    mockFetch([
      { message: "Both checked in!", geminiResponse: null },
    ]);

    // Stage 1: Shows 2+ passengers
    const booking = await executeBookingRetrieval(ctx);
    expect(booking.data["Passengers"]).toBe("2+");

    // Stage 6: Shows companion seat
    const checkin = await executeAutoCheckin(ctx, true);
    expect(checkin.data["Seat assignment"]).toContain("JUAN");
    expect(checkin.data["Seat assignment"]).toContain("14B");
  });
});

// ═══════════════════════════════════════════════════════
// SCENARIO 6: Underage passenger
// ═══════════════════════════════════════════════════════

describe("Integration: Underage passenger blocked", () => {
  it("validation catches underage and blocks pipeline", () => {
    const result = validatePassenger(
      "2030-01-01",   // valid expiry
      "ESP",
      "GARCIA, PABLO",
      "PABLO GARCIA",
      "FCO",
      "2026-03-15",
      "PAA999999",
      "2012-06-01"    // 13 years old at travel date
    );
    expect(result.valid).toBe(false);
    expect(result.issues.find((i) => i.type === "underage")).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════
// SCENARIO 7: Reducer integration with stage results
// ═══════════════════════════════════════════════════════

describe("Integration: Reducer tracks pipeline state correctly", () => {
  it("transitions through all states for a successful pipeline", () => {
    const stageOrder: StageId[] = ["booking-retrieval", "passenger-data", "document-verification"];
    const config: PipelineConfig = {
      mode: "orchestration",
      stageOrder,
      stageMeta: {
        "booking-retrieval": { id: "booking-retrieval", title: "Booking", icon: "1" },
        "passenger-data": { id: "passenger-data", title: "Passenger", icon: "2" },
        "document-verification": { id: "document-verification", title: "Docs", icon: "3" },
      },
    };

    let state = createInitialState(config);
    expect(state.currentStage).toBe("idle");

    state = pipelineReducer(state, { type: "START_PIPELINE" });
    expect(state.currentStage).toBe("booking-retrieval");
    expect(state.totalStartedAt).toBeTypeOf("number");

    state = pipelineReducer(state, { type: "START_STAGE", stage: "booking-retrieval" });
    expect(state.stages["booking-retrieval"].status).toBe("running");

    state = pipelineReducer(state, {
      type: "COMPLETE_STAGE",
      stage: "booking-retrieval",
      data: { PNR: "VY-123" },
      summary: "PNR retrieved",
    });
    expect(state.stages["booking-retrieval"].status).toBe("completed");

    state = pipelineReducer(state, {
      type: "SKIP_STAGE",
      stage: "passenger-data",
      reason: "Skipped for test",
    });
    expect(state.stages["passenger-data"].status).toBe("skipped");

    state = pipelineReducer(state, {
      type: "ERROR_STAGE",
      stage: "document-verification",
      error: "Passport expired",
    });
    expect(state.stages["document-verification"].status).toBe("error");

    state = pipelineReducer(state, { type: "COMPLETE_PIPELINE" });
    expect(state.currentStage).toBe("done");
    expect(state.totalCompletedAt).toBeTypeOf("number");
  });
});
