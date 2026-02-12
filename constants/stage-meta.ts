/**
 * Pipeline stage metadata — titles, icons, and display order.
 * Defines both demo and orchestration pipeline configurations.
 */

import type { StageId, StageMeta, PipelineConfig } from "@/types";

// --- Demo Pipeline (4-stage) ---

export const DEMO_STAGE_ORDER: StageId[] = ["channels", "scan", "checkin", "delivery"];

export const DEMO_STAGE_META: Record<string, StageMeta> = {
  channels: { title: "Channel Preferences", icon: "channels" },
  scan: { title: "Identity Scan", icon: "scan" },
  checkin: { title: "Automatic Check-In", icon: "checkin" },
  delivery: { title: "Delivery & Extras", icon: "delivery" },
};

export const DEMO_PIPELINE_CONFIG: PipelineConfig = {
  mode: "demo",
  stageOrder: DEMO_STAGE_ORDER,
  stageMeta: DEMO_STAGE_META,
};

// --- Orchestration Pipeline (7-stage) ---

export const ORCH_STAGE_ORDER: StageId[] = [
  "booking-retrieval",
  "passenger-data",
  "document-verification",
  "bag-status",
  "delivery-preferences",
  "auto-checkin",
  "post-checkin-comms",
];

export const ORCH_STAGE_META: Record<string, StageMeta> = {
  "booking-retrieval": { title: "Booking Retrieval", icon: "booking" },
  "passenger-data": { title: "Passenger Information", icon: "passenger" },
  "document-verification": { title: "Document Verification", icon: "scan" },
  "bag-status": { title: "Baggage Check", icon: "bags" },
  "delivery-preferences": { title: "Delivery Preferences", icon: "channels" },
  "auto-checkin": { title: "Automatic Check-In", icon: "checkin" },
  "post-checkin-comms": { title: "Post Check-In Comms", icon: "comms" },
};

export const ORCH_PIPELINE_CONFIG: PipelineConfig = {
  mode: "orchestration",
  stageOrder: ORCH_STAGE_ORDER,
  stageMeta: ORCH_STAGE_META,
};

// --- Backward-compat exports ---

export const STAGE_ORDER = DEMO_STAGE_ORDER;
export const STAGE_META = DEMO_STAGE_META;
