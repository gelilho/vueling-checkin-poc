/**
 * Bag status stage executor.
 * Simulates checked-bag and cabin-bag status lookup.
 */

import type { PipelineContext, StageResult } from "@/types";
import { ORCH_STAGE_DURATIONS } from "@/constants";
import { withMinDelay } from "@/lib/utils";

export async function executeBagStatus(
  ctx: PipelineContext
): Promise<StageResult> {
  return withMinDelay(async () => {
    const hasBag = Boolean(ctx.checkedBag);

    const data: Record<string, string> = {
      "Checked bags": hasBag ? "1 \u00d7 23kg" : "None booked",
      "Cabin bag": "1 \u00d7 included",
      "Status": hasBag
        ? "Bags confirmed \u2713"
        : "No bags \u2014 nudge opportunity",
    };

    return {
      data,
      summary: hasBag ? "1 checked bag confirmed" : "No checked bags",
    };
  }, ORCH_STAGE_DURATIONS["bag-status"]);
}
