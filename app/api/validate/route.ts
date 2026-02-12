import { NextRequest, NextResponse } from "next/server";
import { validatePassenger } from "@/lib/validator";

/**
 * POST /api/validate
 * Validates passenger documents: number format (passport/DNI/NIE),
 * expiry date, DOB, age (18+), route requirements, ETIAS, name matching.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      passportExpiry,
      nationality,
      passportName,
      bookingName,
      destination,
      travelDate,
      passportNumber,
      dateOfBirth,
    } = body;

    const result = validatePassenger(
      passportExpiry,
      nationality,
      passportName,
      bookingName,
      destination,
      travelDate,
      passportNumber,
      dateOfBirth
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { valid: false, issues: [{ type: "unknown", severity: "error", details: "Validation failed" }] },
      { status: 500 }
    );
  }
}
