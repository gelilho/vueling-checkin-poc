/**
 * Identity scan stage executor (demo pipeline).
 * Simulates passport scanning using pre-loaded passenger data.
 */

import type { PipelineContext, StageResult } from "@/types";
import { STAGE_DURATIONS } from "@/constants";
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

