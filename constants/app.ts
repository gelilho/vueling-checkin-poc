/**
 * Application-level constants.
 */

/** Default flight data used for live scan demos */
export const LIVE_SCAN_DEFAULTS = {
  flight: "VY1234",
  origin: "BCN",
  destination: "FCO",
  destinationCity: "Rome",
  date: "2026-03-15",
  departure: "16:35",
  terminal: "T1",
  gate: "B34",
  seat: "14A",
  tripDays: 5,
} as const;

/** Unknown country code fallback */
export const UNKNOWN_COUNTRY_CODE = "UNK";
