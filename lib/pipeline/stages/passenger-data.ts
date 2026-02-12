/**
 * Passenger data stage executor.
 * Simulates CRM profile pull for the traveller.
 */

import type { PipelineContext, StageResult } from "@/types";
import { ORCH_STAGE_DURATIONS } from "@/constants";
import { withMinDelay } from "@/lib/utils";

export async function executePassengerData(
  ctx: PipelineContext
): Promise<StageResult> {
  return withMinDelay(async () => {
    const data: Record<string, string> = {
      "Full name": ctx.name || "Unknown",
      "Nationality": ctx.nationality || "N/A",
      "Date of birth": ctx.dateOfBirth || "N/A",
      "Passport number": ctx.passportNumber || "N/A",
      "Loyalty tier": ctx.loyaltyTier || "Standard",
      "Language": ctx.language?.toUpperCase() || "EN",
    };

    return {
      data,
      summary: `${ctx.name} \u2014 profile loaded`,
    };
  }, ORCH_STAGE_DURATIONS["passenger-data"]);
}
