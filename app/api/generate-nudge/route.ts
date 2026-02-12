import { NextRequest, NextResponse } from "next/server";
import {
  generateText,
  BAG_NUDGE_PROMPT,
  CHECKIN_CONFIRMATION_PROMPT,
  DOCUMENT_ISSUE_PROMPT,
} from "@/lib/gemini";
import { fillTemplate } from "@/lib/utils/string";
import type { NudgeType } from "@/types";

/**
 * POST /api/generate-nudge
 * Generates AI push messages via Gemini 2.0 Flash.
 * Types: bag_nudge, checkin_confirmation, document_issue.
 * Falls back to static message if Gemini is unavailable.
 *
 * Prompts defined in: lib/gemini/prompts.ts
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type }: { type: NudgeType } = body;

    let prompt: string;

    if (type === "bag_nudge") {
      prompt = fillTemplate(BAG_NUDGE_PROMPT, {
        name: body.name,
        destination: body.destination,
        trip_days: String(body.trip_days),
        party_info: body.party_info || "Traveling alone",
        language: body.language || "en",
      });
    } else if (type === "checkin_confirmation") {
      prompt = fillTemplate(CHECKIN_CONFIRMATION_PROMPT, {
        name: body.name,
        flight_number: body.flight_number,
        origin: body.origin,
        destination: body.destination,
        date: body.date,
        seat: body.seat,
        companion_info: body.companion_info || "No companion",
        language: body.language || "en",
      });
    } else if (type === "document_issue") {
      prompt = fillTemplate(DOCUMENT_ISSUE_PROMPT, {
        issue_type: body.issue_type,
        issue_details: body.issue_details,
        name: body.name,
        destination: body.destination,
        travel_date: body.travel_date,
        language: body.language || "en",
      });
    } else {
      return NextResponse.json(
        { error: "Unknown type" },
        { status: 400 }
      );
    }

    const message = await generateText(prompt);

    return NextResponse.json({
      message,
      geminiResponse: {
        model: "gemini-2.0-flash",
        type,
        prompt,
        response: message,
      },
    });
  } catch (error) {
    console.error("Nudge generation error:", error);
    return NextResponse.json(
      {
        message: "Welcome aboard! You're all set for your flight.",
        geminiResponse: null,
      },
      { status: 200 }
    );
  }
}
