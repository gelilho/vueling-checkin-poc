/**
 * Auto check-in stage executor.
 * Assigns seats and generates AI confirmation if documents are valid.
 * Blocks check-in if document verification failed.
 * Returns `geminiResponse` from the confirmation call.
 */

import type { PipelineContext, CheckinStageResult } from "@/types";
import { API_ENDPOINTS, ORCH_STAGE_DURATIONS } from "@/constants";
import { withMinDelay } from "@/lib/utils";

export async function executeAutoCheckin(
  ctx: PipelineContext,
  docValid: boolean
): Promise<CheckinStageResult & { geminiResponse?: unknown }> {
  return withMinDelay(async () => {
    const data: Record<string, string> = {
      "Check-in window": `Flight ${ctx.flight} \u2014 within 48h \u2713`,
    };

    if (!docValid) {
      data["Seat assignment"] = "\u2014";
      data["Status"] = "\u2717 Blocked \u2014 document issue";

      return {
        data,
        summary: "Check-in blocked",
        valid: false,
        issueMessage: "Cannot check in due to unresolved document issue.",
      };
    }

    // Assign seat
    data["Seat assignment"] = formatSeatAssignment(ctx);
    data["Status"] = "\u2713 Automatically checked in";

    // Generate AI confirmation message
    const { message, geminiResponse } = await fetchConfirmationMessage(ctx);

    return {
      data,
      summary: `Checked in \u2014 Seat ${ctx.seat}`,
      valid: true,
      confirmationMessage: message,
      geminiResponse,
    };
  }, ORCH_STAGE_DURATIONS["auto-checkin"]);
}

// --- Helpers ---

function formatSeatAssignment(ctx: PipelineContext): string {
  if (ctx.companion) {
    return `${ctx.seat} (next to ${ctx.companion} in ${ctx.companionSeat})`;
  }
  return ctx.seat || "Assigned";
}

async function fetchConfirmationMessage(
  ctx: PipelineContext
): Promise<{ message: string; geminiResponse: unknown }> {
  try {
    const res = await fetch(API_ENDPOINTS.GENERATE_NUDGE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "checkin_confirmation",
        name: ctx.name,
        flight_number: ctx.flight,
        origin: ctx.origin,
        destination: ctx.destinationCity || ctx.destination,
        date: ctx.date,
        seat: ctx.seat,
        companion_info: ctx.companion
          ? `${ctx.companion} (Seat ${ctx.companionSeat})`
          : "No companion",
        language: ctx.language || "en",
      }),
    });
    const data = await res.json();
    return {
      message: data.message as string,
      geminiResponse: data.geminiResponse || null,
    };
  } catch {
    return {
      message: `You're checked in for ${ctx.flight}. Seat ${ctx.seat}.`,
      geminiResponse: null,
    };
  }
}
