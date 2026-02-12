/**
 * Document verification stage executor.
 * Calls the /api/validate endpoint to check passport validity
 * and name matching.
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
      }),
    });
    const valData: { valid: boolean; issues: ValidationIssue[] } =
      await valRes.json();

    const data: Record<string, string> = {
      "Passport": ctx.passportNumber || "N/A",
      "Issuing country": ctx.issuingCountry || ctx.nationality || "N/A",
      "Expiry": ctx.passportExpiry || "N/A",
      "Passport validity": hasIssueType(valData.issues, "passport_expiry")
        ? "\u26a0\ufe0f Issue"
        : "\u2713 Valid",
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

