import { NextRequest, NextResponse } from "next/server";
import { scanPassport } from "@/lib/gemini";
import { stripDataUrlPrefix } from "@/lib/utils";
import { parseAndValidateMRZ } from "@/lib/mrz-parser";
import type { ParsedPassport } from "@/types";

/**
 * POST /api/scan-passport
 * Scans identity documents using Gemini Vision.
 * Supports: passports, Spanish DNI, NIE, EU ID cards.
 *
 * Only returns parsed/structured data — raw Gemini payload is never exposed.
 */
export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    // Remove data URL prefix if present
    const base64Data = stripDataUrlPrefix(image);

    const rawData = await scanPassport(base64Data);

    if (!rawData.success) {
      return NextResponse.json(
        {
          success: false,
          error: rawData.error || "Could not read the document. Try again with better lighting.",
        },
        { status: 422 }
      );
    }

    const parsed: ParsedPassport | null = parseAndValidateMRZ(rawData);

    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not parse document data. Please try again with a clearer photo.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error("Document scan error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process document image. Please try again.",
      },
      { status: 500 }
    );
  }
}
