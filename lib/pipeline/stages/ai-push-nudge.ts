/**
 * AI Smart Nudge stage executor.
 * Detects upsell/nudge opportunities (e.g. no checked bags) and generates
 * a personalised AI message via Gemini. Falls back to a static message
 * if the AI endpoint is unavailable.
 *
 * All content produced by this stage is clearly flagged as AI-generated.
 */

import type { PipelineContext, StageResult } from "@/types";
import { API_ENDPOINTS, ORCH_STAGE_DURATIONS } from "@/constants";
import { withMinDelay } from "@/lib/utils";

export interface AiNudgeStageResult extends StageResult {
  nudgeMessage: string;
  aiGenerated: boolean;
}

export async function executeAiPushNudge(
  ctx: PipelineContext,
  checkinSucceeded: boolean
): Promise<AiNudgeStageResult> {
  return withMinDelay(async () => {
    const data: Record<string, string> = {};

    // Skip nudge if check-in was blocked
    if (!checkinSucceeded) {
      data["Opportunity"] = "— (check-in blocked)";
      data["AI Content"] = "Skipped";
      return {
        data,
        summary: "No nudge — check-in blocked",
        nudgeMessage: "",
        aiGenerated: false,
      };
    }

    // Detect nudge opportunity
    const hasNoBag = !ctx.checkedBag;
    const nudgeType = hasNoBag ? "bag_upsell" : "travel_tip";

    data["Opportunity detected"] = hasNoBag
      ? "No checked bag — upsell opportunity"
      : "Travel tip opportunity";
    data["Channel"] = "Push notification";
    data["Powered by"] = "Google Gemini 2.0 Flash";

    // Try AI-generated nudge via Gemini
    let nudgeMessage: string;
    let aiGenerated = false;

    try {
      const res = await fetch(API_ENDPOINTS.GENERATE_NUDGE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: hasNoBag ? "bag_nudge" : "travel_tip",
          name: ctx.name,
          destination: ctx.destinationCity || ctx.destination,
          trip_days: ctx.tripDays || 3,
          party_info: ctx.companion || "Traveling alone",
          language: ctx.language || "en",
          nudge_type: nudgeType,
        }),
      });
      const result = await res.json();
      if (result.message && typeof result.message === "string") {
        nudgeMessage = result.message;
        aiGenerated = true;
      } else {
        throw new Error("No message in response");
      }
    } catch {
      // Fallback: static nudge message
      nudgeMessage = hasNoBag
        ? `Hi ${ctx.name || "there"}! Heading to ${ctx.destinationCity || ctx.destination} without checked luggage? Add a bag now from just €19.99 and skip the airport stress.`
        : `Hi ${ctx.name || "there"}! Enjoy your trip to ${ctx.destinationCity || ctx.destination}. Check out our destination guide for local tips!`;
      aiGenerated = false;
    }

    data["Content source"] = aiGenerated
      ? "✦ AI-Generated (Gemini 2.0 Flash)"
      : "✦ Fallback template";
    data["Status"] = "Ready to deliver ✓";

    return {
      data,
      summary: aiGenerated ? "AI nudge generated ✓" : "Fallback nudge ready ✓",
      nudgeMessage,
      aiGenerated,
    };
  }, ORCH_STAGE_DURATIONS["ai-push-nudge"]);
}
