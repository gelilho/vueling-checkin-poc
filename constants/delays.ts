/**
 * Timing constants for pipeline stage animations and pacing.
 * Controls the visual rhythm of both demo and orchestration pipelines.
 */

/** Minimum display time for any pipeline stage (ms) */
export const MIN_STAGE_DURATION_MS = 800;

/** Pause between pipeline stages (ms) */
export const INTER_STAGE_DELAY_MS = 400;

/** Per-stage minimum durations for demo pipeline */
export const STAGE_DURATIONS = {
  channels: 800,
  scan: 1200,
  checkin: 1500,
  delivery: 1200,
} as const;

/** Per-stage minimum durations for orchestration pipeline */
export const ORCH_STAGE_DURATIONS = {
  "booking-retrieval": 1000,
  "passenger-data": 800,
  "document-verification": 1500,
  "bag-status": 600,
  "delivery-preferences": 600,
  "auto-checkin": 1800,
  "post-checkin-comms": 1200,
} as const;

/** Delay between passengers in batch processing (ms) */
export const BATCH_PASSENGER_DELAY_MS = 500;

/** DataReveal animation timing */
export const DATA_REVEAL = {
  DEFAULT_STAGGER_MS: 200,
  SCAN_STAGGER_MS: 180,
  CHECKIN_STAGGER_MS: 250,
  CHANNEL_STAGGER_MS: 150,
  DELIVERY_STAGGER_MS: 150,
  ORCH_STAGGER_MS: 200,
  COMPLETION_BUFFER_MS: 500,
} as const;
