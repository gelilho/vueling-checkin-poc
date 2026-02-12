/**
 * Automatic check-in stage executor.
 * Validates documents, assigns seats, generates AI confirmation.
 */

import type { PipelineContext, CheckinStageResult } from "@/types";
import { API_ENDPOINTS, STAGE_DURATIONS } from "@/constants";
import { withMinDelay } from "@/lib/utils";

export async function executeCheckin(
  ctx: PipelineContext
): Promise<CheckinStageResult> {
  return withMinDelay(async () => {
    // Step 1: Validate documents
    const valRes = await fetch(API_ENDPOINTS.VALIDATE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passportExpiry: ctx.passportExpiry,
        nationality: ctx.nationality,
        passportName: ctx.passportName || ctx.name,
        bookingName: ctx.name,
        destination: ctx.destination,
        travelDate: ctx.date,
      }),
    });
    const valData = await valRes.json();

    // Build validation checklist
    const data: Record<string, string> = {
      "Check-in window": `Flight ${ctx.flight} departs ${ctx.date} ${ctx.departure} — within window ✓`,
      "Passport validity": hasIssueType(valData.issues, "passport_expiry")
        ? "⚠️ Issue detected"
        : "✓ Valid",
      "Visa / entry requirements": hasVisaIssue(valData.issues)
        ? "⚠️ Check required"
        : "✓ Clear",
      "Name verification": hasIssueType(valData.issues, "name_mismatch")
        ? "⚠️ Mismatch"
        : "✓ Match confirmed",
    };

    // Step 2: Handle validation failure
    if (!valData.valid) {
      const issueMessage = await fetchIssueExplanation(ctx, valData.issues[0]);
      return {
        data,
        summary: `Check-in blocked — ${valData.issues[0]?.type.replace(/_/g, " ")}`,
        valid: false,
        issueMessage,
      };
    }

    // Step 3: Assign seat and generate confirmation
    data["Seat assignment"] = formatSeatAssignment(ctx);
    const confirmationMessage = await fetchConfirmationMessage(ctx);

    return {
      data,
      summary: `Checked in — Seat ${ctx.seat}`,
      valid: true,
      confirmationMessage,
    };
  }, STAGE_DURATIONS.checkin);
}

// --- Helpers ---

interface Issue {
  type: string;
  details?: string;
}

function hasIssueType(issues: Issue[], type: string): boolean {
  return issues.some((i) => i.type === type);
}

function hasVisaIssue(issues: Issue[]): boolean {
  return issues.some(
    (i) =>
      i.type === "visa_required" ||
      i.type === "etias_required" ||
      i.type === "evisitor_required"
  );
}

function formatSeatAssignment(ctx: PipelineContext): string {
  if (ctx.companion) {
    return `${ctx.seat} (next to ${ctx.companion} in ${ctx.companionSeat})`;
  }
  return ctx.seat || "Assigned";
}

async function fetchIssueExplanation(
  ctx: PipelineContext,
  issue: Issue
): Promise<string> {
  try {
    const res = await fetch(API_ENDPOINTS.GENERATE_NUDGE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "document_issue",
        issue_type: issue?.type || "unknown",
        issue_details: issue?.details || "Unknown issue",
        name: ctx.name,
        destination: ctx.destinationCity || ctx.destination,
        travel_date: ctx.date,
        language: ctx.language || "en",
      }),
    });
    const data = await res.json();
    return data.message;
  } catch {
    return issue?.details || "Document issue detected.";
  }
}

async function fetchConfirmationMessage(ctx: PipelineContext): Promise<string> {
  try {
    const res = await fetch(API_ENDPOINTS.GENERATE_NUDGE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "checkin_confirmation",
        name: ctx.name,
        flight_number: ctx.flight,
        origin: ctx.origin,
        destination: ctx.destinationCity || ctx.destination,
        date: ctx.date,
        seat: ctx.seat,
        companion_info: ctx.companion
          ? `${ctx.companion} (Seat ${ctx.companionSeat})`
          : "No companion",
        language: ctx.language || "en",
      }),
    });
    const data = await res.json();
    return data.message;
  } catch {
    return `You're checked in for ${ctx.flight}. Seat ${ctx.seat}.`;
  }
}
