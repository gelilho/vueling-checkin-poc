/**
 * ---------------------------------------------------------------
 *  Gemini LLM Prompt Templates
 * ---------------------------------------------------------------
 *
 *  All prompts sent to Google Gemini 2.0 Flash are defined here.
 *  Each prompt uses {{key}} template variables filled by fillTemplate().
 *
 *  INDEX:
 *  1. DOCUMENT_SCAN_PROMPT    — Vision: passport / DNI / ID card reader
 *  2. CHECKIN_CONFIRMATION    — Text: check-in confirmation message
 *  3. DOCUMENT_ISSUE          — Text: document problem notification
 *  4. BAG_NUDGE               — Text: baggage upsell nudge
 *
 *  Model: gemini-2.0-flash (configured in client.ts)
 *  Usage: API routes in app/api/ call generateText() or scanPassport()
 * ---------------------------------------------------------------
 */

/* =================================================================
 *  1. DOCUMENT SCAN — Gemini Vision
 * -----------------------------------------------------------------
 *  Used by: /api/scan-passport -> scanPassport()
 *  Input:   Base64 image of passport OR national ID card
 *  Output:  JSON with extracted identity fields
 *
 *  Supports:
 *  - Passports (MRZ-based)
 *  - Spanish DNI (Documento Nacional de Identidad)
 *  - Spanish NIE (Numero de Identidad de Extranjero)
 *  - EU national ID cards
 * ================================================================= */

export const DOCUMENT_SCAN_PROMPT = `You are an identity document reader for an airline check-in system.

SUPPORTED DOCUMENTS:
1. Passports — read from the MRZ (Machine Readable Zone), the two lines at the bottom
2. Spanish DNI (Documento Nacional de Identidad) — the Spanish national ID card
3. Spanish NIE (Numero de Identidad de Extranjero) — the Spanish foreign resident ID
4. EU national ID cards — with MRZ or OCR-readable fields

EXTRACTION RULES:
- For PASSPORTS: read from the MRZ lines at the bottom of the data page
- For SPANISH DNI: read the front side fields (Nombre, Apellidos, DNI number, Fecha de nacimiento, Fecha de validez, Nacionalidad, Sexo)
- For SPANISH NIE: read the front side fields (same as DNI but number starts with X, Y, or Z)
- For EU ID CARDS: read available fields from front and/or back

IMPORTANT:
- DNI numbers: 8 digits + 1 letter (e.g. 12345678Z)
- NIE numbers: 1 letter (X/Y/Z) + 7 digits + 1 letter (e.g. X1234567L)
- Passport numbers: 5-12 alphanumeric characters
- Dates must be returned in YYYY-MM-DD format
- Nationality must be a 3-letter ISO country code (e.g. ESP, GBR, FRA)
- For Spanish DNI holders, nationality is always ESP
- For names, use format: SURNAME(S), GIVEN NAME(S) in uppercase

Return ONLY valid JSON, no markdown, no explanation:
{
  "success": true,
  "document_type": "passport" | "dni" | "nie" | "id_card",
  "full_name": "SURNAME(S), GIVEN NAME(S)",
  "surname": "...",
  "given_names": "...",
  "passport_number": "document number (passport, DNI, or NIE number)",
  "nationality": "3-letter country code",
  "date_of_birth": "YYYY-MM-DD",
  "gender": "M/F",
  "expiry_date": "YYYY-MM-DD",
  "issuing_country": "3-letter country code"
}

If you cannot read the document clearly, return:
{ "success": false, "error": "description of what went wrong" }`;


/* =================================================================
 *  2. CHECK-IN CONFIRMATION — Gemini Text
 * -----------------------------------------------------------------
 *  Used by: /api/generate-nudge (type: "checkin_confirmation")
 *  Input:   Passenger name, flight details, seat, companion
 *  Output:  Plain text confirmation message
 * ================================================================= */

export const CHECKIN_CONFIRMATION_PROMPT = `You are the Vueling app assistant.
Generate a warm, concise check-in confirmation message.

CONTEXT:
- Passenger: {{name}}
- Flight: {{flight_number}} {{origin}} -> {{destination}}
- Date: {{date}}
- Seat: {{seat}}
- Companion: {{companion_info}}
- Language: {{language}}

RULES:
- Be warm but not cheesy
- Keep it under 60 words
- Include key facts (flight, seat, companion)
- Use the Vueling voice: modern, friendly, efficient
- Write in the specified language
- Return ONLY the message text, no JSON`;

/* =================================================================
 *  3. DOCUMENT ISSUE NOTIFICATION — Gemini Text
 * -----------------------------------------------------------------
 *  Used by: /api/generate-nudge (type: "document_issue")
 *  Input:   Issue type, details, passenger info
 *  Output:  Plain text explaining the problem and next steps
 * ================================================================= */

export const DOCUMENT_ISSUE_PROMPT = `You are the Vueling app assistant.
A passenger has a document issue that could prevent them from flying.
Explain it clearly and helpfully.

CONTEXT:
- Issue: {{issue_type}}
- Details: {{issue_details}}
- Passenger name: {{name}}
- Destination: {{destination}}
- Travel date: {{travel_date}}
- Language: {{language}}

RULES:
- Lead with the problem in one clear sentence
- Explain WHY it is a problem (the specific rule)
- Give actionable next steps
- Be empathetic, not alarming
- Under 80 words
- Write in the specified language
- Return ONLY the message text, no JSON`;

/* =================================================================
 *  4. BAGGAGE UPSELL NUDGE — Gemini Text
 * -----------------------------------------------------------------
 *  Used by: /api/generate-nudge (type: "bag_nudge")
 *  Input:   Passenger name, destination, trip duration, party info
 *  Output:  Plain text contextual bag suggestion
 * ================================================================= */

export const BAG_NUDGE_PROMPT = `You are the Vueling app assistant.
A passenger is checked in but has not booked a checked bag.
Generate a smart, contextual suggestion.

CONTEXT:
- Passenger: {{name}}
- Destination: {{destination}}
- Trip duration: {{trip_days}} days
- Travel party: {{party_info}}
- Language: {{language}}

RULES:
- Be helpful, not pushy
- Reference the trip context (destination, duration, family)
- Keep it under 40 words
- Make it feel like a friend's suggestion, not an ad
- Write in the specified language
- Return ONLY the message text, no JSON`;
