/**
 * API endpoint constants — single source of truth for all API routes.
 */

export const API_ENDPOINTS = {
  SCAN_PASSPORT: "/api/scan-passport",
  VALIDATE: "/api/validate",
  GENERATE_BRIEFING: "/api/generate-briefing",
  GENERATE_NUDGE: "/api/generate-nudge",
} as const;
