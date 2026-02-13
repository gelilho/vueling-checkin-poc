/**
 * Pipeline module barrel export.
 */

export { pipelineReducer, createInitialState } from "./reducer";
export type { PipelineAction } from "./reducer";
export {
  // Demo pipeline stages
  executeChannels,
  executeScanMocked,
  executeCheckin,
  executeDelivery,
  // Orchestration pipeline stages
  executeBookingRetrieval,
  executePassengerData,
  executeDocumentVerification,
  executeBagStatus,
  executeDeliveryPreferences,
  executeAutoCheckin,
  executePostCheckinComms,
  executeAiPushNudge,
} from "./stages";
export type { AiNudgeStageResult } from "./stages";
