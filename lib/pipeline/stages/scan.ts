/**
 * Identity scan stage executors.
 * Handles both mocked (demo) and live (camera) passport scanning.
 */

import type { PipelineContext, StageResult, ScanStageResult } from "@/types";
import { API_ENDPOINTS, STAGE_DURATIONS } from "@/constants";
import { withMinDelay } from "@/lib/utils";

/**
 * Simulate a passport scan using pre-loaded passenger data.
 * Used for the 3 demo scenarios.
 */
export async function executeScanMocked(
  ctx: PipelineContext
): Promise<StageResult> {
  return withMinDelay(async () => {
    const data: Record<string, string> = {
      "Full name": ctx.passportName || ctx.name || "Unknown",
      "Passport number": ctx.passportNumber || "N/A",
      Nationality: ctx.nationality || "N/A",
      "Date of birth": ctx.dateOfBirth || "N/A",
      Gender: ctx.gender || "N/A",
      "Expiry date": ctx.passportExpiry || "N/A",
      "Issuing country": ctx.issuingCountry || ctx.nationality || "N/A",
    };

    return {
      data,
      summary: `${ctx.passportName || ctx.name} — ${ctx.nationality} passport`,
    };
  }, STAGE_DURATIONS.scan);
}

/**
 * Perform a real passport scan using Gemini vision via the API.
 * Used for the "Scan your own passport" scenario.
 */
export async function executeScanLive(
  imageBase64: string
): Promise<ScanStageResult> {
  const res = await fetch(API_ENDPOINTS.SCAN_PASSPORT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64 }),
  });
  const result = await res.json();

  if (!result.success) {
    throw new Error(result.error || "Could not read passport");
  }

  const d = result.data;
  const data: Record<string, string> = {
    "Full name": d.fullName,
    "Passport number": d.passportNumber,
    Nationality: d.nationality,
    "Date of birth": d.dateOfBirth,
    Gender: d.gender,
    "Expiry date": d.expiryDate,
    "Issuing country": d.issuingCountry,
  };

  return {
    data,
    summary: `${d.fullName} — ${d.nationality} passport`,
    parsedData: {
      fullName: d.fullName,
      surname: d.surname,
      givenNames: d.givenNames,
      passportNumber: d.passportNumber,
      nationality: d.nationality,
      dateOfBirth: d.dateOfBirth,
      gender: d.gender,
      expiryDate: d.expiryDate,
      issuingCountry: d.issuingCountry,
    },
  };
}
