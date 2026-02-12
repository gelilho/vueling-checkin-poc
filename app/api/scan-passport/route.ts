import { NextRequest, NextResponse } from "next/server";
import { scanPassport } from "@/lib/gemini";
import { stripDataUrlPrefix } from "@/lib/utils";
import { parseAndValidateMRZ } from "@/lib/mrz-parser";
import type { ParsedPassport } from "@/types";

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
      return NextResponse.json({
        success: false,
        error: rawData.error || "Could not read passport. Try again with better lighting.",
      });
    }

    const parsed: ParsedPassport | null = parseAndValidateMRZ(rawData);

    if (!parsed) {
      return NextResponse.json({
        success: false,
        error: "Could not parse passport data. Please try again.",
      });
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error("Passport scan error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process passport image. Please try again.",
      },
      { status: 500 }
    );
  }
}
