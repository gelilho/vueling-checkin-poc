/**
 * useOrchestrationPipeline hook — orchestrates the 7-stage automated pipeline.
 * All stages run automatically in sequence with no interactive pauses.
 * Data comes entirely from the PipelineContext (no live scan support).
 */

"use client";

import { useReducer, useCallback, useState, useRef } from "react";
import { pipelineReducer, createInitialState } from "@/lib/pipeline";
import {
  executeBookingRetrieval,
  executePassengerData,
  executeDocumentVerification,
  executeBagStatus,
  executeDeliveryPreferences,
  executeAutoCheckin,
  executePostCheckinComms,
} from "@/lib/pipeline/stages";
import { delay } from "@/lib/utils";
import { INTER_STAGE_DELAY_MS, ORCH_PIPELINE_CONFIG } from "@/constants";
import type {
  PipelineContext,
  PipelineState,
  StageId,
  CheckinStageResult,
  DeliveryStageResult,
} from "@/types";
import type { PipelineAction } from "@/lib/pipeline";

export interface UseOrchestrationReturn {
  state: PipelineState;
  confirmationMessage: string;
  issueMessage: string;
  bagNudge: string | null;
  checkinValid: boolean;
  runOrchestration: () => Promise<void>;
  dispatch: React.Dispatch<PipelineAction>;
  getStageDuration: (stage: StageId) => number | null;
  totalDuration: number | null;
}

export function useOrchestrationPipeline(
  buildContext: () => PipelineContext
): UseOrchestrationReturn {
  const [state, dispatch] = useReducer(
    pipelineReducer,
    createInitialState(ORCH_PIPELINE_CONFIG)
  );
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [issueMessage, setIssueMessage] = useState("");
  const [bagNudge, setBagNudge] = useState<string | null>(null);
  const [checkinValid, setCheckinValid] = useState(true);
  const runningRef = useRef(false);

  const getStageDuration = useCallback(
    (stage: StageId): number | null => {
      const s = state.stages[stage];
      if (s?.startedAt && s?.completedAt) return s.completedAt - s.startedAt;
      return null;
    },
    [state.stages]
  );

  const totalDuration =
    state.totalStartedAt && state.totalCompletedAt
      ? state.totalCompletedAt - state.totalStartedAt
      : null;

  const runOrchestration = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    const ctx = buildContext();

    dispatch({ type: "START_PIPELINE" });

    // --- Stage 1: Booking Retrieval ---
    dispatch({ type: "START_STAGE", stage: "booking-retrieval" });
    const bookingResult = await executeBookingRetrieval(ctx);
    dispatch({ type: "COMPLETE_STAGE", stage: "booking-retrieval", ...bookingResult });
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 2: Passenger Data ---
    dispatch({ type: "START_STAGE", stage: "passenger-data" });
    const passengerResult = await executePassengerData(ctx);
    dispatch({ type: "COMPLETE_STAGE", stage: "passenger-data", ...passengerResult });
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 3: Document Verification ---
    dispatch({ type: "START_STAGE", stage: "document-verification" });
    const docResult: CheckinStageResult = await executeDocumentVerification(ctx);
    dispatch({ type: "COMPLETE_STAGE", stage: "document-verification", ...docResult });
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 4: Bag Status ---
    dispatch({ type: "START_STAGE", stage: "bag-status" });
    const bagResult = await executeBagStatus(ctx);
    dispatch({ type: "COMPLETE_STAGE", stage: "bag-status", ...bagResult });
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 5: Delivery Preferences ---
    dispatch({ type: "START_STAGE", stage: "delivery-preferences" });
    const deliveryPrefResult = await executeDeliveryPreferences(ctx);
    dispatch({ type: "COMPLETE_STAGE", stage: "delivery-preferences", ...deliveryPrefResult });
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 6: Auto Check-In ---
    let autoCheckinSucceeded = false;

    if (docResult.valid) {
      dispatch({ type: "START_STAGE", stage: "auto-checkin" });
      const checkinResult: CheckinStageResult = await executeAutoCheckin(ctx, true);

      if (checkinResult.valid) {
        autoCheckinSucceeded = true;
        setCheckinValid(true);
        setConfirmationMessage(checkinResult.confirmationMessage || "");
        dispatch({ type: "COMPLETE_STAGE", stage: "auto-checkin", ...checkinResult });
      } else {
        setCheckinValid(false);
        setIssueMessage(checkinResult.issueMessage || "");
        dispatch({
          type: "ERROR_STAGE",
          stage: "auto-checkin",
          error: checkinResult.summary,
          data: checkinResult.data,
        });
      }
    } else {
      setCheckinValid(false);
      setIssueMessage(docResult.issueMessage || "Document verification failed");
      dispatch({
        type: "ERROR_STAGE",
        stage: "auto-checkin",
        error: "Blocked — document verification failed",
      });
    }
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 7: Post Check-In Comms ---
    if (autoCheckinSucceeded) {
      dispatch({ type: "START_STAGE", stage: "post-checkin-comms" });
      const commsResult: DeliveryStageResult = await executePostCheckinComms(ctx);
      setBagNudge(commsResult.bagNudge);
      dispatch({ type: "COMPLETE_STAGE", stage: "post-checkin-comms", ...commsResult });
    } else {
      dispatch({
        type: "SKIP_STAGE",
        stage: "post-checkin-comms",
        reason: "Check-in blocked — cannot deliver boarding pass",
      });
    }

    dispatch({ type: "COMPLETE_PIPELINE" });
    runningRef.current = false;
  }, [buildContext]);

  return {
    state,
    confirmationMessage,
    issueMessage,
    bagNudge,
    checkinValid,
    runOrchestration,
    dispatch,
    getStageDuration,
    totalDuration,
  };
}
