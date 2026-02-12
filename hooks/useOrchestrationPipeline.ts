/**
 * useOrchestrationPipeline hook — orchestrates the 8-stage automated pipeline.
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
  executeAiPushNudge,
} from "@/lib/pipeline/stages";
import type { AiNudgeStageResult } from "@/lib/pipeline/stages";
import { delay, pipelineLog, savePipelineExecution } from "@/lib/utils";
import type { PipelineExecutionLog, PipelineStageLog } from "@/lib/utils";
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
  nudgeMessage: string;
  nudgeAiGenerated: boolean;
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
  const [nudgeMessage, setNudgeMessage] = useState("");
  const [nudgeAiGenerated, setNudgeAiGenerated] = useState(false);
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
    const pipelineStartISO = new Date().toISOString();
    const stageLogs: PipelineStageLog[] = [];

    pipelineLog.pipelineStart("Orchestration (7-stage)", ctx.name);
    dispatch({ type: "START_PIPELINE" });

    // --- Stage 1: Booking Retrieval ---
    pipelineLog.stageStart("booking-retrieval", meta["booking-retrieval"].title);
    const t1 = Date.now();
    const t1ISO = new Date().toISOString();
    dispatch({ type: "START_STAGE", stage: "booking-retrieval" });
    const bookingResult = await executeBookingRetrieval(ctx);
    dispatch({ type: "COMPLETE_STAGE", stage: "booking-retrieval", ...bookingResult });
    pipelineLog.stageDone("booking-retrieval", meta["booking-retrieval"].title, Date.now() - t1, bookingResult.data);
    stageLogs.push({ stageId: "booking-retrieval", stageTitle: meta["booking-retrieval"].title, status: "completed", startedAt: t1ISO, completedAt: new Date().toISOString(), durationMs: Date.now() - t1, data: bookingResult.data || {} });
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 2: Passenger Data ---
    pipelineLog.stageStart("passenger-data", meta["passenger-data"].title);
    const t2 = Date.now();
    const t2ISO = new Date().toISOString();
    dispatch({ type: "START_STAGE", stage: "passenger-data" });
    const passengerResult = await executePassengerData(ctx);
    dispatch({ type: "COMPLETE_STAGE", stage: "passenger-data", ...passengerResult });
    pipelineLog.stageDone("passenger-data", meta["passenger-data"].title, Date.now() - t2, passengerResult.data);
    stageLogs.push({ stageId: "passenger-data", stageTitle: meta["passenger-data"].title, status: "completed", startedAt: t2ISO, completedAt: new Date().toISOString(), durationMs: Date.now() - t2, data: passengerResult.data || {} });
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 3: Document Verification ---
    pipelineLog.stageStart("document-verification", meta["document-verification"].title);
    const t3 = Date.now();
    const t3ISO = new Date().toISOString();
    dispatch({ type: "START_STAGE", stage: "document-verification" });
    const docResult: CheckinStageResult = await executeDocumentVerification(ctx);
    dispatch({ type: "COMPLETE_STAGE", stage: "document-verification", ...docResult });
    pipelineLog.stageDone("document-verification", meta["document-verification"].title, Date.now() - t3, docResult.data);
    stageLogs.push({ stageId: "document-verification", stageTitle: meta["document-verification"].title, status: "completed", startedAt: t3ISO, completedAt: new Date().toISOString(), durationMs: Date.now() - t3, data: docResult.data || {} });
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 4: Bag Status ---
    pipelineLog.stageStart("bag-status", meta["bag-status"].title);
    const t4 = Date.now();
    const t4ISO = new Date().toISOString();
    dispatch({ type: "START_STAGE", stage: "bag-status" });
    const bagResult = await executeBagStatus(ctx);
    dispatch({ type: "COMPLETE_STAGE", stage: "bag-status", ...bagResult });
    pipelineLog.stageDone("bag-status", meta["bag-status"].title, Date.now() - t4, bagResult.data);
    stageLogs.push({ stageId: "bag-status", stageTitle: meta["bag-status"].title, status: "completed", startedAt: t4ISO, completedAt: new Date().toISOString(), durationMs: Date.now() - t4, data: bagResult.data || {} });
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 5: Delivery Preferences ---
    pipelineLog.stageStart("delivery-preferences", meta["delivery-preferences"].title);
    const t5 = Date.now();
    const t5ISO = new Date().toISOString();
    dispatch({ type: "START_STAGE", stage: "delivery-preferences" });
    const deliveryPrefResult = await executeDeliveryPreferences(ctx);
    dispatch({ type: "COMPLETE_STAGE", stage: "delivery-preferences", ...deliveryPrefResult });
    pipelineLog.stageDone("delivery-preferences", meta["delivery-preferences"].title, Date.now() - t5, deliveryPrefResult.data);
    stageLogs.push({ stageId: "delivery-preferences", stageTitle: meta["delivery-preferences"].title, status: "completed", startedAt: t5ISO, completedAt: new Date().toISOString(), durationMs: Date.now() - t5, data: deliveryPrefResult.data || {} });
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 6: Auto Check-In ---
    let autoCheckinSucceeded = false;
    const t6 = Date.now();
    const t6ISO = new Date().toISOString();

    if (docResult.valid) {
      pipelineLog.stageStart("auto-checkin", meta["auto-checkin"].title);
      dispatch({ type: "START_STAGE", stage: "auto-checkin" });
      const checkinResult: CheckinStageResult = await executeAutoCheckin(ctx, true);

      if (checkinResult.valid) {
        autoCheckinSucceeded = true;
        setCheckinValid(true);
        setConfirmationMessage(checkinResult.confirmationMessage || "");
        dispatch({ type: "COMPLETE_STAGE", stage: "auto-checkin", ...checkinResult });
        pipelineLog.stageDone("auto-checkin", meta["auto-checkin"].title, Date.now() - t6, checkinResult.data);
        stageLogs.push({ stageId: "auto-checkin", stageTitle: meta["auto-checkin"].title, status: "completed", startedAt: t6ISO, completedAt: new Date().toISOString(), durationMs: Date.now() - t6, data: checkinResult.data || {} });
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
        stageLogs.push({ stageId: "auto-checkin", stageTitle: meta["auto-checkin"].title, status: "error", startedAt: t6ISO, completedAt: new Date().toISOString(), durationMs: Date.now() - t6, data: checkinResult.data || {}, error: checkinResult.summary });
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
      stageLogs.push({ stageId: "auto-checkin", stageTitle: meta["auto-checkin"].title, status: "error", startedAt: t6ISO, completedAt: new Date().toISOString(), durationMs: Date.now() - t6, data: {}, error: "Blocked — document verification failed" });
    }
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 7: Post Check-In Comms ---
    const t7 = Date.now();
    const t7ISO = new Date().toISOString();
    if (autoCheckinSucceeded) {
      pipelineLog.stageStart("post-checkin-comms", meta["post-checkin-comms"].title);
      dispatch({ type: "START_STAGE", stage: "post-checkin-comms" });
      const commsResult: DeliveryStageResult = await executePostCheckinComms(ctx);
      setBagNudge(commsResult.bagNudge);
      dispatch({ type: "COMPLETE_STAGE", stage: "post-checkin-comms", ...commsResult });
      pipelineLog.stageDone("post-checkin-comms", meta["post-checkin-comms"].title, Date.now() - t7, commsResult.data);
      stageLogs.push({ stageId: "post-checkin-comms", stageTitle: meta["post-checkin-comms"].title, status: "completed", startedAt: t7ISO, completedAt: new Date().toISOString(), durationMs: Date.now() - t7, data: commsResult.data || {} });
    } else {
      dispatch({
        type: "SKIP_STAGE",
        stage: "post-checkin-comms",
        reason: "Check-in blocked — cannot deliver boarding pass",
      });
      pipelineLog.stageSkip("post-checkin-comms", meta["post-checkin-comms"].title, "Check-in blocked");
      stageLogs.push({ stageId: "post-checkin-comms", stageTitle: meta["post-checkin-comms"].title, status: "skipped", startedAt: t7ISO, completedAt: new Date().toISOString(), durationMs: Date.now() - t7, data: {}, error: "Check-in blocked — cannot deliver boarding pass" });
    }

    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 8: AI Smart Nudge ---
    const t8 = Date.now();
    const t8ISO = new Date().toISOString();
    pipelineLog.stageStart("ai-push-nudge", meta["ai-push-nudge"].title);
    dispatch({ type: "START_STAGE", stage: "ai-push-nudge" });
    const nudgeResult: AiNudgeStageResult = await executeAiPushNudge(ctx, autoCheckinSucceeded);
    setNudgeMessage(nudgeResult.nudgeMessage);
    setNudgeAiGenerated(nudgeResult.aiGenerated);
    dispatch({ type: "COMPLETE_STAGE", stage: "ai-push-nudge", ...nudgeResult });
    pipelineLog.stageDone("ai-push-nudge", meta["ai-push-nudge"].title, Date.now() - t8, nudgeResult.data);
    stageLogs.push({ stageId: "ai-push-nudge", stageTitle: meta["ai-push-nudge"].title, status: "completed", startedAt: t8ISO, completedAt: new Date().toISOString(), durationMs: Date.now() - t8, data: nudgeResult.data || {} });

    // --- Save execution log to localStorage ---
    const pipelineEndTime = Date.now();
    const executionLog: PipelineExecutionLog = {
      id: `orch-${ctx.passengerId}-${pipelineStartTime}`,
      pipelineType: "orchestration",
      passengerName: ctx.name || ctx.passengerId,
      passengerId: ctx.passengerId,
      flight: ctx.flight || "—",
      startedAt: pipelineStartISO,
      completedAt: new Date().toISOString(),
      totalDurationMs: pipelineEndTime - pipelineStartTime,
      result: autoCheckinSucceeded ? "checked-in" : "blocked",
      stages: stageLogs,
    };
    savePipelineExecution(executionLog);

    dispatch({ type: "COMPLETE_PIPELINE" });
    pipelineLog.pipelineComplete(Date.now() - pipelineStartTime, ORCH_PIPELINE_CONFIG.stageOrder.length);
    runningRef.current = false;
  }, [buildContext]);

  return {
    state,
    confirmationMessage,
    issueMessage,
    bagNudge,
    nudgeMessage,
    nudgeAiGenerated,
    checkinValid,
    runOrchestration,
    dispatch,
    getStageDuration,
    totalDuration,
  };
}
