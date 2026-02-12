/**
 * Pipeline execution log storage.
 * Records every pipeline run with per-stage timestamps, data, and durations.
 * Persists to localStorage and can be exported as CSV.
 */

const PIPELINE_LOG_KEY = "vueling_pipeline_executions";

export interface PipelineStageLog {
  stageId: string;
  stageTitle: string;
  status: "completed" | "error" | "skipped";
  startedAt: string;
  completedAt: string;
  durationMs: number;
  data: Record<string, string>;
  error?: string;
}

export interface PipelineExecutionLog {
  id: string;
  pipelineType: "orchestration" | "demo";
  passengerName: string;
  passengerId: string;
  flight: string;
  startedAt: string;
  completedAt: string;
  totalDurationMs: number;
  result: "checked-in" | "blocked";
  stages: PipelineStageLog[];
}

/** Get all pipeline executions from localStorage */
export function getPipelineExecutions(): PipelineExecutionLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PIPELINE_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PipelineExecutionLog[];
  } catch {
    return [];
  }
}

/** Save a new pipeline execution */
export function savePipelineExecution(log: PipelineExecutionLog): void {
  if (typeof window === "undefined") return;
  const existing = getPipelineExecutions();
  existing.push(log);
  localStorage.setItem(PIPELINE_LOG_KEY, JSON.stringify(existing));
}

/** Get the status for a passenger from past executions */
export function getPassengerPipelineStatus(passengerId: string): "checked-in" | "blocked" | null {
  const executions = getPipelineExecutions();
  // Find the latest execution for this passenger
  for (let i = executions.length - 1; i >= 0; i--) {
    if (executions[i].passengerId === passengerId) {
      return executions[i].result;
    }
  }
  return null;
}

/** Get execution count */
export function getPipelineExecutionCount(): number {
  return getPipelineExecutions().length;
}

/** Export all pipeline executions as a flat CSV (one row per stage) */
export function pipelineExecutionsToCSV(): string {
  const executions = getPipelineExecutions();
  if (executions.length === 0) return "";

  const headers = [
    "execution_id",
    "pipeline_type",
    "passenger_name",
    "passenger_id",
    "flight",
    "pipeline_started_at",
    "pipeline_completed_at",
    "pipeline_total_ms",
    "pipeline_result",
    "stage_id",
    "stage_title",
    "stage_status",
    "stage_started_at",
    "stage_completed_at",
    "stage_duration_ms",
    "stage_data",
    "stage_error",
  ];

  const rows: string[] = [headers.join(",")];

  for (const exec of executions) {
    for (const stage of exec.stages) {
      const dataStr = Object.entries(stage.data)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");

      const row = [
        esc(exec.id),
        esc(exec.pipelineType),
        esc(exec.passengerName),
        esc(exec.passengerId),
        esc(exec.flight),
        esc(exec.startedAt),
        esc(exec.completedAt),
        String(exec.totalDurationMs),
        esc(exec.result),
        esc(stage.stageId),
        esc(stage.stageTitle),
        esc(stage.status),
        esc(stage.startedAt),
        esc(stage.completedAt),
        String(stage.durationMs),
        esc(dataStr),
        esc(stage.error || ""),
      ];
      rows.push(row.join(","));
    }
  }

  return rows.join("\n");
}

function esc(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Download pipeline executions as CSV */
export function downloadPipelineExecutionsCSV(): void {
  const csv = pipelineExecutionsToCSV();
  if (!csv) return;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vueling-pipeline-log-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Clear all execution logs */
export function clearPipelineExecutions(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PIPELINE_LOG_KEY);
}
