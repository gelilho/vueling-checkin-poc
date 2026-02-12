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
  checkinSucceeded: boolean,
  docIssueMessage?: string
): Promise<AiNudgeStageResult> {
  return withMinDelay(async () => {
    const data: Record<string, string> = {};

    // --- Document issue path: send nudge about the problem ---
    if (!checkinSucceeded && docIssueMessage) {
      data["Opportunity detected"] = "Document issue — passenger action required";
      data["Channel"] = "Push notification";
      data["Powered by"] = "Google Gemini 2.0 Flash";

      let nudgeMessage: string;
      let aiGenerated = false;

      try {
        const res = await fetch(API_ENDPOINTS.GENERATE_NUDGE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "document_issue",
            name: ctx.name,
            destination: ctx.destinationCity || ctx.destination,
            travel_date: ctx.date,
            issue_type: "document_verification_failed",
            issue_details: docIssueMessage,
            language: ctx.language || "en",
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
        nudgeMessage = `Hi ${ctx.name || "there"}, we couldn't complete your automatic check-in for your flight to ${ctx.destinationCity || ctx.destination}. Issue: ${docIssueMessage}. Please update your documents or contact support.`;
        aiGenerated = false;
      }

      data["Content source"] = aiGenerated
        ? "✦ AI-Generated (Gemini 2.0 Flash)"
        : "✦ Fallback template";
      data["Status"] = "Ready to deliver ✓";

      return {
        data,
        summary: aiGenerated ? "AI issue nudge generated ✓" : "Fallback issue nudge ready ✓",
        nudgeMessage,
        aiGenerated,
      };
    }

    // --- Happy path: bag upsell or travel tip ---
    const hasNoBag = !ctx.checkedBag;
    const nudgeType = hasNoBag ? "bag_upsell" : "travel_tip";

    data["Opportunity detected"] = hasNoBag
      ? "No checked bag — upsell opportunity"
      : "Travel tip opportunity";
    data["Channel"] = "Push notification";
    data["Powered by"] = "Google Gemini 2.0 Flash";

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
