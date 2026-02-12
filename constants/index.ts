/**
 * Constants barrel export.
 */

export { CHANNELS, DEFAULT_CHANNELS, getChannelLabel, getChannelIcon } from "./channels";
export type { ChannelConfig } from "./channels";
export {
  MIN_STAGE_DURATION_MS,
  INTER_STAGE_DELAY_MS,
  STAGE_DURATIONS,
  ORCH_STAGE_DURATIONS,
  BATCH_PASSENGER_DELAY_MS,
  DATA_REVEAL,
} from "./delays";
export { API_ENDPOINTS } from "./api";
export { SCENARIO_META } from "./scenarios";
export type { ScenarioMeta } from "./scenarios";
export { APP_CONFIG, LIVE_SCAN_DEFAULTS, CAMERA_CONFIG, UNKNOWN_COUNTRY_CODE } from "./app";
export {
  STAGE_ORDER,
  STAGE_META,
  DEMO_STAGE_ORDER,
  DEMO_STAGE_META,
  DEMO_PIPELINE_CONFIG,
  ORCH_STAGE_ORDER,
  ORCH_STAGE_META,
  ORCH_PIPELINE_CONFIG,
} from "./stage-meta";
