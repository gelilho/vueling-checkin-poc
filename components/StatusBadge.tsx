"use client";

import type { PassengerCheckInStatus } from "@/types";

interface StatusBadgeProps {
  status: PassengerCheckInStatus;
}

const badgeStyles: Record<PassengerCheckInStatus, string> = {
  pending: "bg-gray-100 text-gray-600",
  "missing-docs": "bg-amber-100 text-amber-700",
  ready: "bg-blue-100 text-blue-700",
  processing: "bg-vueling-yellow/30 text-vueling-dark animate-status-pulse",
  "checked-in": "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700",
};

const badgeLabels: Record<PassengerCheckInStatus, string> = {
  pending: "Pending",
  "missing-docs": "Missing docs",
  ready: "Ready",
  processing: "Processing...",
  "checked-in": "Checked in",
  blocked: "Blocked",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${badgeStyles[status]}`}
    >
      {badgeLabels[status]}
    </span>
  );
}
