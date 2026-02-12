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
import { delay } from "@/lib/utils";
import { INTER_STAGE_DELAY_MS } from "@/constants";
import type {
  DeliveryChannel,
  PipelineContext,
  PipelineState,
  StageId,
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
  const [state, dispatch] = useReducer(pipelineReducer, createInitialState());
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

    dispatch({ type: "START_PIPELINE" });

    // --- Stage 1: Channel Preferences ---
    dispatch({ type: "START_STAGE", stage: "channels" });
    const channelResult = await executeChannels(channels);
    dispatch({ type: "COMPLETE_STAGE", stage: "channels", ...channelResult });
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 2: Identity Scan ---
    dispatch({ type: "START_STAGE", stage: "scan" });

    if (isLiveScan) {
      try {
        const scanResult = await new Promise<ScanStageResult>((resolve, reject) => {
          liveScanResolveRef.current = resolve;
          liveScanRejectRef.current = reject;
        });
        onLiveScanDataReceived?.(scanResult.parsedData);
        dispatch({ type: "COMPLETE_STAGE", stage: "scan", ...scanResult });
      } catch (err) {
        dispatch({
          type: "ERROR_STAGE",
          stage: "scan",
          error: err instanceof Error ? err.message : "Scan failed",
        });
        runningRef.current = false;
        dispatch({ type: "COMPLETE_PIPELINE" });
        return;
      }
    } else {
      const ctx = buildContext();
      const scanResult = await executeScanMocked(ctx);
      dispatch({ type: "COMPLETE_STAGE", stage: "scan", ...scanResult });
    }
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 3: Automatic Check-In ---
    dispatch({ type: "START_STAGE", stage: "checkin" });
    const ctx = buildContext();
    const checkinResult = await executeCheckin(ctx);

    if (checkinResult.valid) {
      setCheckinValid(true);
      setConfirmationMessage(checkinResult.confirmationMessage || "");
      dispatch({ type: "COMPLETE_STAGE", stage: "checkin", ...checkinResult });
    } else {
      setCheckinValid(false);
      setIssueMessage(checkinResult.issueMessage || "");
      dispatch({
        type: "ERROR_STAGE",
        stage: "checkin",
        error: checkinResult.summary,
        data: checkinResult.data,
      });
    }
    await delay(INTER_STAGE_DELAY_MS);

    // --- Stage 4: Delivery + Extras ---
    if (checkinResult.valid) {
      dispatch({ type: "START_STAGE", stage: "delivery" });
      const deliveryResult = await executeDelivery(ctx, channels);
      setBagNudge(deliveryResult.bagNudge);
      dispatch({ type: "COMPLETE_STAGE", stage: "delivery", ...deliveryResult });
    } else {
      dispatch({
        type: "SKIP_STAGE",
        stage: "delivery",
        reason: "Check-in blocked — cannot deliver boarding pass",
      });
    }

    dispatch({ type: "COMPLETE_PIPELINE" });
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
    resolveLiveScan,
    failLiveScan,
    dispatch,
    getStageDuration,
    totalDuration,
  };
}
