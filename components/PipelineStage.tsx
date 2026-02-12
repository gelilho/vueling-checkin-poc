"use client";

import type { StageStatus } from "@/types";
import { formatDuration } from "@/lib/utils";

interface PipelineStageProps {
  title: string;
  icon: string;
  status: StageStatus;
  duration?: number | null;
  isLast?: boolean;
  children?: React.ReactNode;
}

const icons: Record<string, React.ReactNode> = {
  channels: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  scan: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
    </svg>
  ),
  checkin: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  delivery: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
};

const statusColors: Record<StageStatus, string> = {
  waiting: "border-gray-200 bg-white",
  running: "border-vueling-yellow bg-vueling-yellow/5 animate-stage-glow",
  completed: "border-vueling-green/40 bg-green-50",
  error: "border-vueling-red/40 bg-red-50",
  skipped: "border-gray-200 bg-gray-50",
};

const dotColors: Record<StageStatus, string> = {
  waiting: "bg-gray-200 text-gray-400",
  running: "bg-vueling-yellow text-vueling-dark",
  completed: "bg-vueling-green text-white",
  error: "bg-vueling-red text-white",
  skipped: "bg-gray-300 text-gray-500",
};

const connectorColors: Record<StageStatus, string> = {
  waiting: "bg-gray-200",
  running: "bg-gray-200",
  completed: "bg-vueling-green",
  error: "bg-vueling-red/30",
  skipped: "bg-gray-200",
};

export default function PipelineStage({
  title,
  icon,
  status,
  duration,
  isLast,
  children,
}: PipelineStageProps) {
  const isExpanded = status === "running" || status === "error";
  const showChildren = status !== "waiting" && status !== "skipped";

  return (
    <div className="flex gap-3">
      {/* Left: dot + connector */}
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${dotColors[status]}`}
        >
          {status === "completed" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : status === "error" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
          ) : status === "running" ? (
            <div className="w-3 h-3 rounded-full border-2 border-vueling-dark border-t-transparent animate-spin" />
          ) : (
            icons[icon]
          )}
        </div>
        {!isLast && (
          <div
            className={`w-0.5 flex-1 min-h-[16px] transition-colors duration-500 ${connectorColors[status]}`}
          />
        )}
      </div>

      {/* Right: content card */}
      <div
        className={`flex-1 rounded-xl border p-3 mb-3 transition-all duration-300 ${statusColors[status]}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3
            className={`text-sm font-semibold ${
              status === "waiting" || status === "skipped"
                ? "text-gray-400"
                : "text-vueling-dark"
            }`}
          >
            {title}
          </h3>
          {duration != null && status !== "waiting" && status !== "running" && (
            <span className="text-[10px] font-mono text-vueling-gray bg-gray-100 px-1.5 py-0.5 rounded">
              {formatDuration(duration)}
            </span>
          )}
          {status === "running" && (
            <span className="text-[10px] font-medium text-vueling-dark bg-vueling-yellow/30 px-1.5 py-0.5 rounded">
              Running...
            </span>
          )}
        </div>

        {/* Expanded content */}
        {showChildren && children && (
          <div
            className={`mt-3 overflow-hidden transition-all duration-400 ${
              isExpanded ? "max-h-[600px] opacity-100" : "max-h-[200px] opacity-100"
            }`}
          >
            {children}
          </div>
        )}

        {/* Completed summary (when collapsed) */}
        {status === "completed" && !isExpanded && (
          <p className="text-xs text-vueling-gray mt-1">{/* summary shown via children */}</p>
        )}

        {/* Skipped */}
        {status === "skipped" && (
          <p className="text-xs text-gray-400 mt-1">Skipped</p>
        )}
      </div>
    </div>
  );
}
