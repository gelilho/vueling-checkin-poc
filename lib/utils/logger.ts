/**
 * Pipeline logger — structured console output for pipeline stages.
 * Visible in the browser DevTools console AND Next.js server terminal.
 *
 * Color-coded:
 *   🟡 START  — stage begins
 *   🟢 DONE   — stage completed
 *   🔴 ERROR  — stage failed
 *   ⚪ SKIP   — stage skipped
 *   🏁 PIPELINE — pipeline-level events
 */

const COLORS = {
  pipeline: "color: #6B21A8; font-weight: bold",  // purple
  start: "color: #CA8A04; font-weight: bold",      // yellow
  done: "color: #16A34A; font-weight: bold",        // green
  error: "color: #DC2626; font-weight: bold",       // red
  skip: "color: #9CA3AF; font-weight: bold",        // gray
  data: "color: #6B7280",                           // muted
  time: "color: #2563EB; font-weight: bold",        // blue
};

function ts(): string {
  return new Date().toISOString().split("T")[1].replace("Z", "");
}

function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}

export const pipelineLog = {
  /** Log pipeline start */
  pipelineStart(name: string, passengerName?: string) {
    console.log(
      `%c🏁 PIPELINE START %c— ${name}${passengerName ? ` (${passengerName})` : ""} %c[${ts()}]`,
      COLORS.pipeline,
      COLORS.data,
      COLORS.time
    );
    console.log(
      "%c─────────────────────────────────────────────",
      COLORS.data
    );
  },

  /** Log stage start */
  stageStart(stageId: string, stageTitle: string) {
    console.log(
      `%c  🟡 START %c${stageTitle} %c(${stageId}) %c[${ts()}]`,
      COLORS.start,
      "color: #111; font-weight: bold",
      COLORS.data,
      COLORS.time
    );
  },

  /** Log stage completion with data */
  stageDone(stageId: string, stageTitle: string, durationMs: number, data?: Record<string, string>) {
    console.log(
      `%c  🟢 DONE  %c${stageTitle} %c${formatMs(durationMs)} %c[${ts()}]`,
      COLORS.done,
      "color: #111; font-weight: bold",
      COLORS.time,
      COLORS.data
    );
    if (data && Object.keys(data).length > 0) {
      const maxKeyLen = Math.max(...Object.keys(data).map((k) => k.length));
      for (const [key, value] of Object.entries(data)) {
        const paddedKey = key.padEnd(maxKeyLen);
        console.log(`%c         ${paddedKey}  →  ${value}`, COLORS.data);
      }
    }
  },

  /** Log stage error */
  stageError(stageId: string, stageTitle: string, error: string) {
    console.log(
      `%c  🔴 ERROR %c${stageTitle} %c— ${error} %c[${ts()}]`,
      COLORS.error,
      "color: #111; font-weight: bold",
      "color: #DC2626",
      COLORS.data
    );
  },

  /** Log stage skip */
  stageSkip(stageId: string, stageTitle: string, reason: string) {
    console.log(
      `%c  ⚪ SKIP  %c${stageTitle} %c— ${reason} %c[${ts()}]`,
      COLORS.skip,
      "color: #9CA3AF",
      COLORS.data,
      COLORS.data
    );
  },

  /** Log pipeline complete */
  pipelineComplete(totalMs: number, stageCount: number) {
    console.log(
      "%c─────────────────────────────────────────────",
      COLORS.data
    );
    console.log(
      `%c🏁 PIPELINE COMPLETE %c— ${stageCount} stages in %c${formatMs(totalMs)} %c[${ts()}]`,
      COLORS.pipeline,
      COLORS.data,
      COLORS.time,
      COLORS.data
    );
    console.log("");
  },

  /** Log a generic info line */
  info(msg: string) {
    console.log(`%c  ℹ️  ${msg}`, COLORS.data);
  },
};
