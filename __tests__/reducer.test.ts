/**
 * Unit tests for lib/pipeline/reducer.ts
 * Covers: all action types, state transitions, edge cases.
 */

import { describe, it, expect } from "vitest";
import { pipelineReducer, createInitialState } from "@/lib/pipeline/reducer";
import type { PipelineConfig } from "@/types";

const TEST_CONFIG: PipelineConfig = {
  stageOrder: ["stage-1", "stage-2", "stage-3"] as any[],
  stages: {
    "stage-1": { id: "stage-1", title: "Stage 1", icon: "1" },
    "stage-2": { id: "stage-2", title: "Stage 2", icon: "2" },
    "stage-3": { id: "stage-3", title: "Stage 3", icon: "3" },
  } as any,
};

function initial() {
  return createInitialState(TEST_CONFIG);
}

describe("createInitialState", () => {
  it("creates state with all stages in waiting status", () => {
    const state = initial();
    expect(state.currentStage).toBe("idle");
    expect(state.totalStartedAt).toBeNull();
    expect(state.totalCompletedAt).toBeNull();

    for (const stageId of TEST_CONFIG.stageOrder) {
      expect(state.stages[stageId].status).toBe("waiting");
      expect(state.stages[stageId].data).toBeNull();
      expect(state.stages[stageId].error).toBeNull();
    }
  });
});

describe("pipelineReducer", () => {
  describe("START_PIPELINE", () => {
    it("sets currentStage to first stage and records start time", () => {
      const state = pipelineReducer(initial(), { type: "START_PIPELINE" });
      expect(state.currentStage).toBe("stage-1");
      expect(state.totalStartedAt).toBeTypeOf("number");
      expect(state.totalCompletedAt).toBeNull();
    });

    it("resets all stages when starting", () => {
      let state = initial();
      state = pipelineReducer(state, { type: "START_PIPELINE" });
      state = pipelineReducer(state, {
        type: "COMPLETE_STAGE",
        stage: "stage-1" as any,
        data: { test: "data" },
        summary: "Done",
      });
      // Start again — should reset
      const restarted = pipelineReducer(state, { type: "START_PIPELINE" });
      expect(restarted.stages["stage-1"].status).toBe("waiting");
      expect(restarted.stages["stage-1"].data).toBeNull();
    });
  });

  describe("START_STAGE", () => {
    it("sets stage to running with start time", () => {
      let state = pipelineReducer(initial(), { type: "START_PIPELINE" });
      state = pipelineReducer(state, { type: "START_STAGE", stage: "stage-1" as any });
      expect(state.currentStage).toBe("stage-1");
      expect(state.stages["stage-1"].status).toBe("running");
      expect(state.stages["stage-1"].startedAt).toBeTypeOf("number");
    });
  });

  describe("COMPLETE_STAGE", () => {
    it("sets stage to completed with data and summary", () => {
      let state = pipelineReducer(initial(), { type: "START_PIPELINE" });
      state = pipelineReducer(state, { type: "START_STAGE", stage: "stage-1" as any });
      state = pipelineReducer(state, {
        type: "COMPLETE_STAGE",
        stage: "stage-1" as any,
        data: { key: "value" },
        summary: "Stage 1 done",
      });
      expect(state.stages["stage-1"].status).toBe("completed");
      expect(state.stages["stage-1"].data).toEqual({ key: "value" });
      expect(state.stages["stage-1"].summary).toBe("Stage 1 done");
      expect(state.stages["stage-1"].completedAt).toBeTypeOf("number");
    });
  });

  describe("ERROR_STAGE", () => {
    it("sets stage to error with error message", () => {
      let state = pipelineReducer(initial(), { type: "START_PIPELINE" });
      state = pipelineReducer(state, { type: "START_STAGE", stage: "stage-2" as any });
      state = pipelineReducer(state, {
        type: "ERROR_STAGE",
        stage: "stage-2" as any,
        error: "Something went wrong",
      });
      expect(state.stages["stage-2"].status).toBe("error");
      expect(state.stages["stage-2"].error).toBe("Something went wrong");
      expect(state.stages["stage-2"].completedAt).toBeTypeOf("number");
    });

    it("stores data alongside error when provided", () => {
      let state = pipelineReducer(initial(), { type: "START_PIPELINE" });
      state = pipelineReducer(state, {
        type: "ERROR_STAGE",
        stage: "stage-2" as any,
        error: "Failed",
        data: { partial: "info" },
      });
      expect(state.stages["stage-2"].data).toEqual({ partial: "info" });
    });
  });

  describe("SKIP_STAGE", () => {
    it("sets stage to skipped with reason", () => {
      let state = pipelineReducer(initial(), { type: "START_PIPELINE" });
      state = pipelineReducer(state, {
        type: "SKIP_STAGE",
        stage: "stage-2" as any,
        reason: "Document verification failed",
      });
      expect(state.stages["stage-2"].status).toBe("skipped");
      expect(state.stages["stage-2"].summary).toBe("Document verification failed");
      expect(state.stages["stage-2"].completedAt).toBeTypeOf("number");
    });
  });

  describe("RETRY_STAGE", () => {
    it("resets a failed stage back to running", () => {
      let state = pipelineReducer(initial(), { type: "START_PIPELINE" });
      state = pipelineReducer(state, {
        type: "ERROR_STAGE",
        stage: "stage-1" as any,
        error: "Failed",
        data: { old: "data" },
      });
      state = pipelineReducer(state, { type: "RETRY_STAGE", stage: "stage-1" as any });
      expect(state.currentStage).toBe("stage-1");
      expect(state.stages["stage-1"].status).toBe("running");
      expect(state.stages["stage-1"].data).toBeNull();
      expect(state.stages["stage-1"].error).toBeNull();
      expect(state.stages["stage-1"].startedAt).toBeTypeOf("number");
    });
  });

  describe("COMPLETE_PIPELINE", () => {
    it("sets currentStage to done and records completion time", () => {
      let state = pipelineReducer(initial(), { type: "START_PIPELINE" });
      state = pipelineReducer(state, { type: "COMPLETE_PIPELINE" });
      expect(state.currentStage).toBe("done");
      expect(state.totalCompletedAt).toBeTypeOf("number");
    });
  });

  describe("RESET", () => {
    it("returns to initial state", () => {
      let state = pipelineReducer(initial(), { type: "START_PIPELINE" });
      state = pipelineReducer(state, {
        type: "COMPLETE_STAGE",
        stage: "stage-1" as any,
        data: { x: "y" },
        summary: "Done",
      });
      state = pipelineReducer(state, { type: "RESET" });
      expect(state.currentStage).toBe("idle");
      expect(state.totalStartedAt).toBeNull();
      expect(state.stages["stage-1"].status).toBe("waiting");
    });
  });

  describe("unknown action", () => {
    it("returns state unchanged for unknown action type", () => {
      const state = initial();
      const result = pipelineReducer(state, { type: "UNKNOWN" } as any);
      expect(result).toBe(state);
    });
  });
});
