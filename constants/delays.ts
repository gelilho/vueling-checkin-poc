/**
 * Timing constants for pipeline stage animations and pacing.
 * Controls the visual rhythm of the orchestration demo.
 */

/** Minimum display time for any pipeline stage (ms) */
export const MIN_STAGE_DURATION_MS = 800;

/** Pause between pipeline stages (ms) */
export const INTER_STAGE_DELAY_MS = 400;

/** Per-stage minimum durations for visual pacing */
export const STAGE_DURATIONS = {
  channels: 800,
  scan: 1200,
  checkin: 1500,
  delivery: 1200,
} as const;

/** DataReveal animation timing */
export const DATA_REVEAL = {
  DEFAULT_STAGGER_MS: 200,
  SCAN_STAGGER_MS: 180,
  CHECKIN_STAGGER_MS: 250,
  CHANNEL_STAGGER_MS: 150,
  DELIVERY_STAGGER_MS: 150,
  COMPLETION_BUFFER_MS: 500,
} as const;
