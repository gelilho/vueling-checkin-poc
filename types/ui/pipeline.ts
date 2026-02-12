/**
 * UI types for the pipeline visualization.
 */

export type StageId = "channels" | "scan" | "checkin" | "delivery";
export type StageStatus = "waiting" | "running" | "completed" | "error" | "skipped";

export interface StageState {
  status: StageStatus;
  data: Record<string, string> | null;
  summary: string;
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
}

export interface PipelineState {
  currentStage: StageId | "idle" | "done";
  stages: Record<StageId, StageState>;
  totalStartedAt: number | null;
  totalCompletedAt: number | null;
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
