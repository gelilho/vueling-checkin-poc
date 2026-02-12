/**
 * Application-level constants.
 */

export const APP_CONFIG = {
  EVENT_NAME: "4YFN 2026",
  EVENT_SUBTITLE: "4YFN / MWC 2026 — Proof of Concept",
  APP_TITLE: "Invisible Check-In",
} as const;

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

/** Camera configuration */
export const CAMERA_CONFIG = {
  FACING_MODE: "environment" as const,
  WIDTH: 1920,
  HEIGHT: 1080,
  JPEG_QUALITY: 0.9,
  GUIDE_WIDTH_PERCENT: 85,
  GUIDE_HEIGHT_PERCENT: 60,
  MRZ_HEIGHT_PERCENT: 25,
} as const;

/** Unknown country code fallback */
export const UNKNOWN_COUNTRY_CODE = "UNK";
