/**
 * Booking retrieval stage executor.
 * Simulates PNR lookup from the airline reservation system.
 */

import type { PipelineContext, StageResult } from "@/types";
import { ORCH_STAGE_DURATIONS } from "@/constants";
import { withMinDelay } from "@/lib/utils";

export async function executeBookingRetrieval(
  ctx: PipelineContext
): Promise<StageResult> {
  return withMinDelay(async () => {
    const pnr = ctx.pnr || "VY-XXXXXX";

    const data: Record<string, string> = {
      "PNR": pnr,
      "Booking date": ctx.bookingDate || "Unknown",
      "Route": `${ctx.origin} \u2192 ${ctx.destination}`,
      "Flight": ctx.flight || "N/A",
      "Travel date": ctx.date || "N/A",
      "Passengers": ctx.companion ? "2+" : "1",
    };

    return {
      data,
      summary: `PNR ${pnr} retrieved`,
    };
  }, ORCH_STAGE_DURATIONS["booking-retrieval"]);
}
