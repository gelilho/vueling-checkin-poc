/**
 * Delivery preferences stage executor.
 * Reads stored channel preferences from the pipeline context.
 */

import type { PipelineContext, DeliveryChannel, StageResult } from "@/types";
import { ORCH_STAGE_DURATIONS, getChannelLabel } from "@/constants";
import { withMinDelay } from "@/lib/utils";

export async function executeDeliveryPreferences(
  ctx: PipelineContext
): Promise<StageResult> {
  return withMinDelay(async () => {
    const channels: DeliveryChannel[] =
      ctx.deliveryPreferences ?? ctx.channels;

    const data: Record<string, string> = {};
    channels.forEach((ch) => {
      data[getChannelLabel(ch)] = "\u2713 Stored preference";
    });
    data["Primary channel"] = getChannelLabel(channels[0]);

    const labels = channels.map(getChannelLabel).join(", ");

    return {
      data,
      summary: `Preferences: ${labels}`,
    };
  }, ORCH_STAGE_DURATIONS["delivery-preferences"]);
}
