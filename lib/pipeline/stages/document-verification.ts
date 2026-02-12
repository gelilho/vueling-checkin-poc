/**
 * Document verification stage executor.
 * Calls the /api/validate endpoint to check passport validity,
 * passport number format, date of birth, age, and name matching.
 */

import type { PipelineContext, CheckinStageResult } from "@/types";
import { API_ENDPOINTS, ORCH_STAGE_DURATIONS } from "@/constants";
import { withMinDelay } from "@/lib/utils";

interface ValidationIssue {
  type: string;
  details?: string;
}

export async function executeDocumentVerification(
  ctx: PipelineContext
): Promise<CheckinStageResult> {
  return withMinDelay(async () => {
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
        passportNumber: ctx.passportNumber,
        dateOfBirth: ctx.dateOfBirth,
      }),
    });
    const valData: { valid: boolean; issues: ValidationIssue[] } =
      await valRes.json();

    const data: Record<string, string> = {
      "Passport": ctx.passportNumber || "N/A",
      "Issuing country": ctx.issuingCountry || ctx.nationality || "N/A",
      "Expiry": ctx.passportExpiry || "N/A",
      "Date of birth": ctx.dateOfBirth || "N/A",
      "Passport number": hasIssueType(valData.issues, "invalid_passport_number")
        ? "\u26a0\ufe0f Invalid format"
        : "\u2713 Valid format",
      "Expiry date": hasIssueType(valData.issues, "invalid_expiry_date")
        ? "\u26a0\ufe0f Invalid"
        : hasIssueType(valData.issues, "passport_expiry")
          ? "\u26a0\ufe0f Expired / insufficient"
          : "\u2713 Valid",
      "Age check": hasIssueType(valData.issues, "underage")
        ? "\u26a0\ufe0f Under 18"
        : hasIssueType(valData.issues, "invalid_dob")
          ? "\u26a0\ufe0f Invalid DOB"
          : "\u2713 18+",
      "Name verification": hasIssueType(valData.issues, "name_mismatch")
        ? "\u26a0\ufe0f Mismatch"
        : "\u2713 Match",
    };

    if (!valData.valid) {
      const firstIssue = valData.issues[0];
      return {
        data,
        summary: "Document issue detected",
        valid: false,
        issueMessage:
          firstIssue?.details ||
          firstIssue?.type.replace(/_/g, " ") ||
          "Validation failed",
      };
    }

    return {
      data,
      summary: "All documents verified \u2713",
      valid: true,
    };
  }, ORCH_STAGE_DURATIONS["document-verification"]);
}

// --- Helpers ---

function hasIssueType(issues: ValidationIssue[], type: string): boolean {
  return issues.some((i) => i.type === type);
}
