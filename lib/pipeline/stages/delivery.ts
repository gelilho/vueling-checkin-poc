/**
 * Delivery & extras stage executor.
 * Generates boarding pass delivery confirmations and bag nudges.
 */

import type { PipelineContext, DeliveryChannel, DeliveryStageResult } from "@/types";
import { API_ENDPOINTS, STAGE_DURATIONS, getChannelIcon } from "@/constants";
import { withMinDelay } from "@/lib/utils";

export async function executeDelivery(
  ctx: PipelineContext,
  channels: DeliveryChannel[]
): Promise<DeliveryStageResult> {
  return withMinDelay(async () => {
    const data: Record<string, string> = {
      "Boarding pass": "Generated ✓",
    };

    // Add delivery channel confirmations
    channels.forEach((ch) => {
      data[`${getChannelIcon(ch)} ${ch.toUpperCase()}`] = "Sent ✓";
    });

    // Generate bag nudge if applicable
    const bagNudge = ctx.checkedBag ? null : await fetchBagNudge(ctx);

    return {
      data,
      summary: `Boarding pass delivered via ${channels.length} channel${channels.length > 1 ? "s" : ""}`,
      bagNudge,
    };
  }, STAGE_DURATIONS.delivery);
}

async function fetchBagNudge(ctx: PipelineContext): Promise<string | null> {
  try {
    const res = await fetch(API_ENDPOINTS.GENERATE_NUDGE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "bag_nudge",
        name: ctx.name,
        destination: ctx.destinationCity || ctx.destination,
        trip_days: ctx.tripDays || 3,
        party_info: ctx.companion || "Traveling alone",
        language: ctx.language || "en",
      }),
    });
    const data = await res.json();
    return data.message;
  } catch {
    return null;
  }
}
