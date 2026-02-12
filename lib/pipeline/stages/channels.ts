/**
 * Channel preferences stage executor.
 */

import type { DeliveryChannel, StageResult } from "@/types";
import { getChannelLabel } from "@/constants";
import { withMinDelay } from "@/lib/utils";
import { STAGE_DURATIONS } from "@/constants";

export async function executeChannels(
  channels: DeliveryChannel[]
): Promise<StageResult> {
  return withMinDelay(async () => {
    const data: Record<string, string> = {};
    channels.forEach((ch) => {
      data[getChannelLabel(ch)] = "✓ Selected";
    });

    const summary = channels.map(getChannelLabel).join(", ");
    return {
      data,
      summary: `Delivering via: ${summary}`,
    };
  }, STAGE_DURATIONS.channels);
}
