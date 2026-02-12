/**
 * Gemini prompt templates.
 * Each prompt uses {{key}} template variables filled by fillTemplate().
 */

export const PASSPORT_SCAN_PROMPT = `You are a passport document reader.
Analyze this passport photo and extract the following information
from the MRZ (Machine Readable Zone) — the two lines of
machine-readable text at the bottom of the passport page.

Return ONLY valid JSON, no markdown, no explanation:
{
  "success": true,
  "full_name": "SURNAME, GIVEN NAMES",
  "surname": "...",
  "given_names": "...",
  "passport_number": "...",
  "nationality": "3-letter country code",
  "date_of_birth": "YYYY-MM-DD",
  "gender": "M/F",
  "expiry_date": "YYYY-MM-DD",
  "issuing_country": "3-letter country code"
}

If you cannot read the MRZ clearly, return:
{ "success": false, "error": "description of what went wrong" }`;

export const CHECKIN_CONFIRMATION_PROMPT = `You are the Vueling app assistant. Generate a warm, concise
check-in confirmation message.

Passenger: {{name}}
Flight: {{flight_number}} {{origin}} → {{destination}}
Date: {{date}}
Seat: {{seat}}
Companion: {{companion_info}}
Language: {{language}}

Rules:
- Be warm but not cheesy
- Keep it under 60 words
- Include key facts (flight, seat, companion)
- Use the Vueling voice: modern, friendly, efficient
- Write in the specified language
- Return ONLY the message text, no JSON`;

export const DOCUMENT_ISSUE_PROMPT = `You are the Vueling app assistant. A passenger has a document
issue that could prevent them from flying. Explain it clearly
and helpfully.

Issue: {{issue_type}}
Details: {{issue_details}}
Passenger name: {{name}}
Destination: {{destination}}
Travel date: {{travel_date}}
Language: {{language}}

Rules:
- Lead with the problem in one clear sentence
- Explain WHY it's a problem (the specific rule)
- Give actionable next steps
- Be empathetic, not alarming
- Under 80 words
- Return ONLY the message text, no JSON`;

export const BAG_NUDGE_PROMPT = `You are the Vueling app assistant. A passenger is checked in
but hasn't booked a checked bag. Generate a smart, contextual
suggestion.

Passenger: {{name}}
Destination: {{destination}}
Trip duration: {{trip_days}} days
Travel party: {{party_info}}
Language: {{language}}

Rules:
- Be helpful, not pushy
- Reference the trip context (destination, duration, family)
- Keep it under 40 words
- Make it feel like a friend's suggestion, not an ad
- Write in the specified language
- Return ONLY the message text, no JSON`;
