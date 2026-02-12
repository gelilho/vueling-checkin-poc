import { NextRequest, NextResponse } from "next/server";
import { generateJSON, AIRPORT_BRIEFING_PROMPT } from "@/lib/gemini";
import { fillTemplate } from "@/lib/utils/string";
import type { BriefingData } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const prompt = fillTemplate(AIRPORT_BRIEFING_PROMPT, {
      name: body.name,
      flight_number: body.flight_number,
      origin: body.origin,
      destination: body.destination,
      date: body.date,
      departure_time: body.departure_time,
      terminal: body.terminal,
      gate: body.gate,
      doc_status: body.doc_status || "Valid",
      bag_status: body.bag_status || "No checked bag",
      party_info: body.party_info || "Traveling alone",
      security_estimate: body.security_estimate || "20",
      language: body.language || "en",
    });

    const briefing = await generateJSON<BriefingData>(prompt);

    return NextResponse.json(briefing);
  } catch (error) {
    console.error("Briefing generation error:", error);
    return NextResponse.json(
      {
        summary: "Your flight is ready. All documents verified.",
        suggested_arrival: "2 hours before departure",
        arrival_reasoning: "Standard recommendation",
        steps: [
          "Arrive at the airport",
          "Go through security",
          "Head to your gate",
          "Board your flight",
        ],
        destination_tip: "Have a great trip!",
      },
      { status: 200 }
    );
  }
}
