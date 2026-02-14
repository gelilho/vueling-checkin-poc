/**
 * Unit tests for lib/pipeline/reducer.ts
 * Covers: all action types, state transitions, edge cases.
 */

import { describe, it, expect } from "vitest";
import { pipelineReducer, createInitialState } from "@/lib/pipeline/reducer";
import type { PipelineConfig, StageId } from "@/types";

const TEST_STAGES: StageId[] = [
  "booking-retrieval",
  "passenger-data",
  "document-verification",
];

const TEST_CONFIG: PipelineConfig = {
  mode: "orchestration",
  stageOrder: TEST_STAGES,
  stageMeta: {
    "booking-retrieval": { id: "booking-retrieval", title: "Booking", icon: "1" },
    "passenger-data": { id: "passenger-data", title: "Passenger", icon: "2" },
    "document-verification": { id: "document-verification", title: "Docs", icon: "3" },
  },
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
      expect(state.currentStage).toBe("booking-retrieval");
      expect(state.totalStartedAt).toBeTypeOf("number");
      expect(state.totalCompletedAt).toBeNull();
    });

    it("resets all stages when starting", () => {
      let state = initial();
      state = pipelineReducer(state, { type: "START_PIPELINE" });
      state = pipelineReducer(state, {
        type: "COMPLETE_STAGE",
        stage: "booking-retrieval",
        data: { test: "data" },
        summary: "Done",
      });
      const restarted = pipelineReducer(state, { type: "START_PIPELINE" });
      expect(restarted.stages["booking-retrieval"].status).toBe("waiting");
      expect(restarted.stages["booking-retrieval"].data).toBeNull();
    });
  });

  describe("START_STAGE", () => {
    it("sets stage to running with start time", () => {
      let state = pipelineReducer(initial(), { type: "START_PIPELINE" });
      state = pipelineReducer(state, { type: "START_STAGE", stage: "booking-retrieval" });
      expect(state.currentStage).toBe("booking-retrieval");
      expect(state.stages["booking-retrieval"].status).toBe("running");
      expect(state.stages["booking-retrieval"].startedAt).toBeTypeOf("number");
    });
  });

  describe("COMPLETE_STAGE", () => {
    it("sets stage to completed with data and summary", () => {
      let state = pipelineReducer(initial(), { type: "START_PIPELINE" });
      state = pipelineReducer(state, { type: "START_STAGE", stage: "booking-retrieval" });
      state = pipelineReducer(state, {
        type: "COMPLETE_STAGE",
        stage: "booking-retrieval",
        data: { key: "value" },
        summary: "Stage 1 done",
      });
      expect(state.stages["booking-retrieval"].status).toBe("completed");
      expect(state.stages["booking-retrieval"].data).toEqual({ key: "value" });
      expect(state.stages["booking-retrieval"].summary).toBe("Stage 1 done");
      expect(state.stages["booking-retrieval"].completedAt).toBeTypeOf("number");
    });
  });

  describe("ERROR_STAGE", () => {
    it("sets stage to error with error message", () => {
      let state = pipelineReducer(initial(), { type: "START_PIPELINE" });
      state = pipelineReducer(state, { type: "START_STAGE", stage: "passenger-data" });
      state = pipelineReducer(state, {
        type: "ERROR_STAGE",
        stage: "passenger-data",
        error: "Something went wrong",
      });
      expect(state.stages["passenger-data"].status).toBe("error");
      expect(state.stages["passenger-data"].error).toBe("Something went wrong");
      expect(state.stages["passenger-data"].completedAt).toBeTypeOf("number");
    });

    it("stores data alongside error when provided", () => {
      let state = pipelineReducer(initial(), { type: "START_PIPELINE" });
      state = pipelineReducer(state, {
        type: "ERROR_STAGE",
        stage: "passenger-data",
        error: "Failed",
        data: { partial: "info" },
      });
      expect(state.stages["passenger-data"].data).toEqual({ partial: "info" });
    });
  });

  describe("SKIP_STAGE", () => {
    it("sets stage to skipped with reason", () => {
      let state = pipelineReducer(initial(), { type: "START_PIPELINE" });
      state = pipelineReducer(state, {
        type: "SKIP_STAGE",
        stage: "passenger-data",
        reason: "Document verification failed",
      });
      expect(state.stages["passenger-data"].status).toBe("skipped");
      expect(state.stages["passenger-data"].summary).toBe("Document verification failed");
      expect(state.stages["passenger-data"].completedAt).toBeTypeOf("number");
    });
  });

  describe("RETRY_STAGE", () => {
    it("resets a failed stage back to running", () => {
      let state = pipelineReducer(initial(), { type: "START_PIPELINE" });
      state = pipelineReducer(state, {
        type: "ERROR_STAGE",
        stage: "booking-retrieval",
        error: "Failed",
        data: { old: "data" },
      });
      state = pipelineReducer(state, { type: "RETRY_STAGE", stage: "booking-retrieval" });
      expect(state.currentStage).toBe("booking-retrieval");
      expect(state.stages["booking-retrieval"].status).toBe("running");
      expect(state.stages["booking-retrieval"].data).toBeNull();
      expect(state.stages["booking-retrieval"].error).toBeNull();
      expect(state.stages["booking-retrieval"].startedAt).toBeTypeOf("number");
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
        stage: "booking-retrieval",
        data: { x: "y" },
        summary: "Done",
      });
      state = pipelineReducer(state, { type: "RESET" });
      expect(state.currentStage).toBe("idle");
      expect(state.totalStartedAt).toBeNull();
      expect(state.stages["booking-retrieval"].status).toBe("waiting");
    });
  });

  describe("unknown action", () => {
    it("returns state unchanged for unknown action type", () => {
      const state = initial();
      // @ts-expect-error Testing unknown action type deliberately
      const result = pipelineReducer(state, { type: "UNKNOWN" });
      expect(result).toBe(state);
    });
  });
});
