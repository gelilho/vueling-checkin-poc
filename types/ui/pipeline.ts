/**
 * UI types for the pipeline visualization.
 * Supports both demo (4-stage) and orchestration (7-stage) pipelines.
 */

/** All possible stage identifiers across both pipeline modes */
export type StageId =
  // Demo pipeline stages
  | "channels"
  | "scan"
  | "checkin"
  | "delivery"
  // Orchestration pipeline stages
  | "booking-retrieval"
  | "passenger-data"
  | "document-verification"
  | "bag-status"
  | "delivery-preferences"
  | "auto-checkin"
  | "post-checkin-comms"
  | "ai-push-nudge";

export type StageStatus = "waiting" | "running" | "completed" | "error" | "skipped";

export interface StageState {
  status: StageStatus;
  data: Record<string, string> | null;
  summary: string;
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
}

/** Pipeline mode determines which stages and layout to use */
export type PipelineMode = "demo" | "orchestration";

/** Pipeline configuration — defines the shape of a pipeline */
export interface PipelineConfig {
  mode: PipelineMode;
  stageOrder: StageId[];
  stageMeta: Record<string, StageMeta>;
}

export interface PipelineState {
  currentStage: StageId | "idle" | "done";
  stages: Record<string, StageState>;
  totalStartedAt: number | null;
  totalCompletedAt: number | null;
  config: PipelineConfig;
}

export type DeliveryChannel = "email" | "sms" | "push" | "app";

export interface PipelineContext {
  passengerId: string;
  isLiveScan: boolean;
  channels: DeliveryChannel[];
  name?: string;
  passportName?: string;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
  dateOfBirth?: string;
  gender?: string;
  issuingCountry?: string;
  flight?: string;
  origin?: string;
  destination?: string;
  destinationCity?: string;
  date?: string;
  departure?: string;
  terminal?: string;
  gate?: string;
  seat?: string;
  companion?: string | null;
  companionSeat?: string | null;
  checkedBag?: boolean;
  tripDays?: number;
  language?: string;
  scenario?: string;
  // Orchestration-specific fields
  pnr?: string;
  bookingDate?: string;
  loyaltyTier?: string | null;
  deliveryPreferences?: DeliveryChannel[];
}

/** Result returned by each pipeline stage executor */
export interface StageResult {
  data: Record<string, string>;
  summary: string;
}

export interface ScanStageResult extends StageResult {
  parsedData: Record<string, string>;
}

export interface CheckinStageResult extends StageResult {
  valid: boolean;
  confirmationMessage?: string;
  issueMessage?: string;
}

export interface DeliveryStageResult extends StageResult {
  bagNudge: string | null;
}

/** Stage metadata for rendering */
export interface StageMeta {
  title: string;
  icon: string;
}
