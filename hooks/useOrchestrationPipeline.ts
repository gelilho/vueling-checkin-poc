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
import { delay, pipelineLog } from "@/lib/utils";
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
    const meta = ORCH_PIPELINE_CONFIG.stageMeta;
    const pipelineStartTime = Date.now();

    pipelineLog.pipelineStart("Orchestration (7-stage)", ctx.name);
    dispatch({ type: "START_PIPELINE" });

    // --- Stage 1: Booking Retrieval ---
    pipelineLog.stageStart("booking-retrieval", meta["booking-retrieval"].title);
    const t1 = Date.now();
    dispatch({ type: "START_STAGE", stage: "booking-retrieval" });
    const bookingResult = await executeBookingRetrieval(ctx);
    dispatch({ type: "COMPLETE_STAGE", stage: "booking-retrieval", ...bookingResult });
    pipelineLog.stageDone("booking-retrieval", meta["booking-retrieval"].title, Date.now() - t1, bookingResult.data);
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 2: Passenger Data ---
    pipelineLog.stageStart("passenger-data", meta["passenger-data"].title);
    const t2 = Date.now();
    dispatch({ type: "START_STAGE", stage: "passenger-data" });
    const passengerResult = await executePassengerData(ctx);
    dispatch({ type: "COMPLETE_STAGE", stage: "passenger-data", ...passengerResult });
    pipelineLog.stageDone("passenger-data", meta["passenger-data"].title, Date.now() - t2, passengerResult.data);
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 3: Document Verification ---
    pipelineLog.stageStart("document-verification", meta["document-verification"].title);
    const t3 = Date.now();
    dispatch({ type: "START_STAGE", stage: "document-verification" });
    const docResult: CheckinStageResult = await executeDocumentVerification(ctx);
    dispatch({ type: "COMPLETE_STAGE", stage: "document-verification", ...docResult });
    pipelineLog.stageDone("document-verification", meta["document-verification"].title, Date.now() - t3, docResult.data);
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 4: Bag Status ---
    pipelineLog.stageStart("bag-status", meta["bag-status"].title);
    const t4 = Date.now();
    dispatch({ type: "START_STAGE", stage: "bag-status" });
    const bagResult = await executeBagStatus(ctx);
    dispatch({ type: "COMPLETE_STAGE", stage: "bag-status", ...bagResult });
    pipelineLog.stageDone("bag-status", meta["bag-status"].title, Date.now() - t4, bagResult.data);
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 5: Delivery Preferences ---
    pipelineLog.stageStart("delivery-preferences", meta["delivery-preferences"].title);
    const t5 = Date.now();
    dispatch({ type: "START_STAGE", stage: "delivery-preferences" });
    const deliveryPrefResult = await executeDeliveryPreferences(ctx);
    dispatch({ type: "COMPLETE_STAGE", stage: "delivery-preferences", ...deliveryPrefResult });
    pipelineLog.stageDone("delivery-preferences", meta["delivery-preferences"].title, Date.now() - t5, deliveryPrefResult.data);
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 6: Auto Check-In ---
    let autoCheckinSucceeded = false;

    if (docResult.valid) {
      pipelineLog.stageStart("auto-checkin", meta["auto-checkin"].title);
      const t6 = Date.now();
      dispatch({ type: "START_STAGE", stage: "auto-checkin" });
      const checkinResult: CheckinStageResult = await executeAutoCheckin(ctx, true);

      if (checkinResult.valid) {
        autoCheckinSucceeded = true;
        setCheckinValid(true);
        setConfirmationMessage(checkinResult.confirmationMessage || "");
        dispatch({ type: "COMPLETE_STAGE", stage: "auto-checkin", ...checkinResult });
        pipelineLog.stageDone("auto-checkin", meta["auto-checkin"].title, Date.now() - t6, checkinResult.data);
      } else {
        setCheckinValid(false);
        setIssueMessage(checkinResult.issueMessage || "");
        dispatch({
          type: "ERROR_STAGE",
          stage: "auto-checkin",
          error: checkinResult.summary,
          data: checkinResult.data,
        });
        pipelineLog.stageError("auto-checkin", meta["auto-checkin"].title, checkinResult.summary);
      }
    } else {
      setCheckinValid(false);
      setIssueMessage(docResult.issueMessage || "Document verification failed");
      dispatch({
        type: "ERROR_STAGE",
        stage: "auto-checkin",
        error: "Blocked — document verification failed",
      });
      pipelineLog.stageError("auto-checkin", meta["auto-checkin"].title, "Blocked — document verification failed");
    }
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 7: Post Check-In Comms ---
    if (autoCheckinSucceeded) {
      pipelineLog.stageStart("post-checkin-comms", meta["post-checkin-comms"].title);
      const t7 = Date.now();
      dispatch({ type: "START_STAGE", stage: "post-checkin-comms" });
      const commsResult: DeliveryStageResult = await executePostCheckinComms(ctx);
      setBagNudge(commsResult.bagNudge);
      dispatch({ type: "COMPLETE_STAGE", stage: "post-checkin-comms", ...commsResult });
      pipelineLog.stageDone("post-checkin-comms", meta["post-checkin-comms"].title, Date.now() - t7, commsResult.data);
    } else {
      dispatch({
        type: "SKIP_STAGE",
        stage: "post-checkin-comms",
        reason: "Check-in blocked — cannot deliver boarding pass",
      });
      pipelineLog.stageSkip("post-checkin-comms", meta["post-checkin-comms"].title, "Check-in blocked");
    }

    dispatch({ type: "COMPLETE_PIPELINE" });
    pipelineLog.pipelineComplete(Date.now() - pipelineStartTime, ORCH_PIPELINE_CONFIG.stageOrder.length);
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
