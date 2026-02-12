/**
 * Pipeline state machine reducer.
 * Pure function — no side effects, no API calls.
 * Generic: works with any PipelineConfig (demo or orchestration).
 */

import type { StageId, StageState, PipelineState, PipelineConfig } from "@/types";

// --- Actions ---

export type PipelineAction =
  | { type: "START_PIPELINE" }
  | { type: "START_STAGE"; stage: StageId }
  | { type: "COMPLETE_STAGE"; stage: StageId; data: Record<string, string>; summary: string }
  | { type: "ERROR_STAGE"; stage: StageId; error: string; data?: Record<string, string> }
  | { type: "SKIP_STAGE"; stage: StageId; reason: string }
  | { type: "RETRY_STAGE"; stage: StageId }
  | { type: "COMPLETE_PIPELINE" }
  | { type: "RESET" };

// --- Initial State ---

function createStageState(): StageState {
  return {
    status: "waiting",
    data: null,
    summary: "",
    startedAt: null,
    completedAt: null,
    error: null,
  };
}

export function createInitialState(config: PipelineConfig): PipelineState {
  const stages: Record<string, StageState> = {};
  for (const stageId of config.stageOrder) {
    stages[stageId] = createStageState();
  }

  return {
    currentStage: "idle",
    stages,
    totalStartedAt: null,
    totalCompletedAt: null,
    config,
  };
}

// --- Reducer ---

export function pipelineReducer(
  state: PipelineState,
  action: PipelineAction
): PipelineState {
  switch (action.type) {
    case "START_PIPELINE":
      return {
        ...createInitialState(state.config),
        currentStage: state.config.stageOrder[0],
        totalStartedAt: Date.now(),
      };

    case "START_STAGE":
      return {
        ...state,
        currentStage: action.stage,
        stages: {
          ...state.stages,
          [action.stage]: {
            ...state.stages[action.stage],
            status: "running",
            startedAt: Date.now(),
          },
        },
      };

    case "COMPLETE_STAGE":
      return {
        ...state,
        stages: {
          ...state.stages,
          [action.stage]: {
            ...state.stages[action.stage],
            status: "completed",
            data: action.data,
            summary: action.summary,
            completedAt: Date.now(),
          },
        },
      };

    case "ERROR_STAGE":
      return {
        ...state,
        stages: {
          ...state.stages,
          [action.stage]: {
            ...state.stages[action.stage],
            status: "error",
            error: action.error,
            data: action.data || null,
            completedAt: Date.now(),
          },
        },
      };

    case "SKIP_STAGE":
      return {
        ...state,
        stages: {
          ...state.stages,
          [action.stage]: {
            ...state.stages[action.stage],
            status: "skipped",
            summary: action.reason,
            completedAt: Date.now(),
          },
        },
      };

    case "RETRY_STAGE":
      return {
        ...state,
        currentStage: action.stage,
        stages: {
          ...state.stages,
          [action.stage]: {
            status: "running",
            data: null,
            summary: "",
            startedAt: Date.now(),
            completedAt: null,
            error: null,
          },
        },
      };

    case "COMPLETE_PIPELINE":
      return {
        ...state,
        currentStage: "done",
        totalCompletedAt: Date.now(),
      };

    case "RESET":
      return createInitialState(state.config);

    default:
      return state;
  }
}
