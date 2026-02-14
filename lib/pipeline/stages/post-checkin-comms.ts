/**
 * Post check-in communications stage executor.
 * Delivers boarding passes via selected channels and generates a bag nudge
 * if the passenger has no checked bags.
 */

import type { PipelineContext, DeliveryChannel, DeliveryStageResult } from "@/types";
import { API_ENDPOINTS, ORCH_STAGE_DURATIONS, getChannelIcon } from "@/constants";
import { withMinDelay } from "@/lib/utils";

export async function executePostCheckinComms(
  ctx: PipelineContext
): Promise<DeliveryStageResult> {
  return withMinDelay(async () => {
    const channels: DeliveryChannel[] =
      ctx.deliveryPreferences ?? ctx.channels;

    const data: Record<string, string> = {
      "Boarding pass": "Generated \u2713",
    };

    // Add delivery channel confirmations
    channels.forEach((ch) => {
      data[`${getChannelIcon(ch)} ${ch.toUpperCase()}`] = "Sent \u2713";
    });

    // Generate bag nudge if no checked bag
    const bagNudge = ctx.checkedBag ? null : await fetchBagNudge(ctx);

    return {
      data,
      summary: `Boarding pass delivered via ${channels.length} channel${channels.length > 1 ? "s" : ""}`,
      bagNudge,
    };
  }, ORCH_STAGE_DURATIONS["post-checkin-comms"]);
}

// --- Helpers ---

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
    if (data.fallback) return null; // Gemini was unavailable
    return data.message as string;
  } catch {
    return null;
  }
}
