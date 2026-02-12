/**
 * usePipeline hook — orchestrates the 4-stage pipeline.
 * Manages state, triggers stage executors, handles live scan callbacks.
 *
 * Separates business logic from UI rendering (PipelineView).
 */

"use client";

import { useReducer, useCallback, useState, useRef } from "react";
import {
  pipelineReducer,
  createInitialState,
  executeChannels,
  executeScanMocked,
  executeCheckin,
  executeDelivery,
} from "@/lib/pipeline";
import { delay, pipelineLog } from "@/lib/utils";
import { INTER_STAGE_DELAY_MS, DEMO_PIPELINE_CONFIG } from "@/constants";
import type {
  DeliveryChannel,
  PipelineContext,
  PipelineState,
  StageId,
  StageState,
  ScanStageResult,
} from "@/types";
import type { PipelineAction } from "@/lib/pipeline";

export interface UsePipelineReturn {
  state: PipelineState;
  channels: DeliveryChannel[];
  setChannels: (ch: DeliveryChannel[]) => void;
  confirmationMessage: string;
  issueMessage: string;
  bagNudge: string | null;
  checkinValid: boolean;
  runPipeline: () => Promise<void>;
  retryScan: () => void;
  resolveLiveScan: (result: ScanStageResult) => void;
  failLiveScan: (error: string) => void;
  dispatch: React.Dispatch<PipelineAction>;
  getStageDuration: (stage: StageId) => number | null;
  totalDuration: number | null;
}

export function usePipeline(
  buildContext: () => PipelineContext,
  isLiveScan: boolean,
  onLiveScanDataReceived?: (parsedData: Record<string, string>) => void
): UsePipelineReturn {
  const [state, dispatch] = useReducer(pipelineReducer, createInitialState(DEMO_PIPELINE_CONFIG));
  const [channels, setChannels] = useState<DeliveryChannel[]>(["email", "push", "app"]);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [issueMessage, setIssueMessage] = useState("");
  const [bagNudge, setBagNudge] = useState<string | null>(null);
  const [checkinValid, setCheckinValid] = useState(true);
  const runningRef = useRef(false);
  const liveScanResolveRef = useRef<((v: ScanStageResult) => void) | null>(null);
  const liveScanRejectRef = useRef<((err: Error) => void) | null>(null);

  const resolveLiveScan = useCallback((result: ScanStageResult) => {
    liveScanResolveRef.current?.(result);
  }, []);

  const failLiveScan = useCallback((error: string) => {
    liveScanRejectRef.current?.(new Error(error));
  }, []);

  const retryScan = useCallback(() => {
    dispatch({ type: "RETRY_STAGE", stage: "scan" as StageId });
    liveScanResolveRef.current = null;
    liveScanRejectRef.current = null;
  }, []);

  const getStageDuration = useCallback(
    (stage: StageId): number | null => {
      const s = state.stages[stage];
      if (s.startedAt && s.completedAt) return s.completedAt - s.startedAt;
      return null;
    },
    [state.stages]
  );

  const totalDuration =
    state.totalStartedAt && state.totalCompletedAt
      ? state.totalCompletedAt - state.totalStartedAt
      : null;

  const runPipeline = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    const meta = DEMO_PIPELINE_CONFIG.stageMeta;
    const pipelineStartTime = Date.now();

    pipelineLog.pipelineStart("Demo (4-stage)", buildContext().name);
    dispatch({ type: "START_PIPELINE" });

    // --- Stage 1: Channel Preferences ---
    pipelineLog.stageStart("channels", meta.channels.title);
    const t1 = Date.now();
    dispatch({ type: "START_STAGE", stage: "channels" });
    const channelResult = await executeChannels(channels);
    dispatch({ type: "COMPLETE_STAGE", stage: "channels", ...channelResult });
    pipelineLog.stageDone("channels", meta.channels.title, Date.now() - t1, channelResult.data);
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 2: Identity Scan ---
    pipelineLog.stageStart("scan", meta.scan.title);
    const t2 = Date.now();
    dispatch({ type: "START_STAGE", stage: "scan" });

    if (isLiveScan) {
      try {
        const scanResult = await new Promise<ScanStageResult>((resolve, reject) => {
          liveScanResolveRef.current = resolve;
          liveScanRejectRef.current = reject;
        });
        onLiveScanDataReceived?.(scanResult.parsedData);
        dispatch({ type: "COMPLETE_STAGE", stage: "scan", ...scanResult });
        pipelineLog.stageDone("scan", meta.scan.title, Date.now() - t2, scanResult.data);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Scan failed";
        dispatch({
          type: "ERROR_STAGE",
          stage: "scan",
          error: errMsg,
        });
        pipelineLog.stageError("scan", meta.scan.title, errMsg);
        runningRef.current = false;
        dispatch({ type: "COMPLETE_PIPELINE" });
        pipelineLog.pipelineComplete(Date.now() - pipelineStartTime, 2);
        return;
      }
    } else {
      const ctx = buildContext();
      const scanResult = await executeScanMocked(ctx);
      dispatch({ type: "COMPLETE_STAGE", stage: "scan", ...scanResult });
      pipelineLog.stageDone("scan", meta.scan.title, Date.now() - t2, scanResult.data);
    }
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 3: Automatic Check-In ---
    pipelineLog.stageStart("checkin", meta.checkin.title);
    const t3 = Date.now();
    dispatch({ type: "START_STAGE", stage: "checkin" });
    const ctx = buildContext();
    const checkinResult = await executeCheckin(ctx);

    if (checkinResult.valid) {
      setCheckinValid(true);
      setConfirmationMessage(checkinResult.confirmationMessage || "");
      dispatch({ type: "COMPLETE_STAGE", stage: "checkin", ...checkinResult });
      pipelineLog.stageDone("checkin", meta.checkin.title, Date.now() - t3, checkinResult.data);
    } else {
      setCheckinValid(false);
      setIssueMessage(checkinResult.issueMessage || "");
      dispatch({
        type: "ERROR_STAGE",
        stage: "checkin",
        error: checkinResult.summary,
        data: checkinResult.data,
      });
      pipelineLog.stageError("checkin", meta.checkin.title, checkinResult.summary);
    }
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 4: Delivery + Extras ---
    if (checkinResult.valid) {
      pipelineLog.stageStart("delivery", meta.delivery.title);
      const t4 = Date.now();
      dispatch({ type: "START_STAGE", stage: "delivery" });
      const deliveryResult = await executeDelivery(ctx, channels);
      setBagNudge(deliveryResult.bagNudge);
      dispatch({ type: "COMPLETE_STAGE", stage: "delivery", ...deliveryResult });
      pipelineLog.stageDone("delivery", meta.delivery.title, Date.now() - t4, deliveryResult.data);
    } else {
      dispatch({
        type: "SKIP_STAGE",
        stage: "delivery",
        reason: "Check-in blocked — cannot deliver boarding pass",
      });
      pipelineLog.stageSkip("delivery", meta.delivery.title, "Check-in blocked");
    }

    dispatch({ type: "COMPLETE_PIPELINE" });
    pipelineLog.pipelineComplete(Date.now() - pipelineStartTime, DEMO_PIPELINE_CONFIG.stageOrder.length);
    runningRef.current = false;
  }, [channels, isLiveScan, buildContext, onLiveScanDataReceived]);

  return {
    state,
    channels,
    setChannels,
    confirmationMessage,
    issueMessage,
    bagNudge,
    checkinValid,
    runPipeline,
    retryScan,
    resolveLiveScan,
    failLiveScan,
    dispatch,
    getStageDuration,
    totalDuration,
  };
}
