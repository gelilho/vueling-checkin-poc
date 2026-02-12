"use client";

import type { PassengerCheckInStatus } from "@/types";
import StatusBadge from "./StatusBadge";

export interface RosterPassenger {
  id: string;
  name: string;
  passportNumber?: string;
  checkedBag?: boolean;
  status: PassengerCheckInStatus;
  /** True if this passenger came from the Booking flow (localStorage) */
  fromBooking?: boolean;
}

interface PassengerRosterProps {
  passengers: RosterPassenger[];
  processingId: string | null;
  onProcess: (passengerId: string) => void;
  onProcessAll: () => void;
}

export default function PassengerRoster({
  passengers,
  processingId,
  onProcess,
  onProcessAll,
}: PassengerRosterProps) {
  const allDone = passengers.every(
    (p) => p.status === "checked-in" || p.status === "blocked"
  );
  const anyProcessing = passengers.some((p) => p.status === "processing");

  return (
    <div className="mt-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-vueling-dark">Passengers</h3>
        {!allDone && (
          <button
            onClick={onProcessAll}
            disabled={anyProcessing}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-vueling-yellow text-vueling-dark
              hover:bg-vueling-yellow/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Process All
          </button>
        )}
      </div>

      {/* Passenger list */}
      <div className="space-y-2">
        {passengers.map((p) => (
          <div
            key={p.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
              processingId === p.id
                ? "border-vueling-yellow bg-vueling-yellow/5"
                : "border-gray-100 bg-white"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Passport icon */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                p.passportNumber ? "bg-green-50 text-vueling-green" : "bg-amber-50 text-amber-500"
              }`}>
                {p.passportNumber ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-vueling-dark truncate">{p.name}</p>
                  {p.fromBooking && (
                    <span className="shrink-0 text-[8px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      Booking
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusBadge status={p.status} />
                  {p.checkedBag === false && (
                    <span className="text-[10px] text-amber-600 font-medium">No bag</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action */}
            {p.status !== "checked-in" && p.status !== "blocked" && p.status !== "processing" && (
              <button
                onClick={() => onProcess(p.id)}
                disabled={anyProcessing}
                className="text-[11px] font-semibold px-3 py-1 rounded-lg border border-vueling-dark/20
                  text-vueling-dark hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all shrink-0 ml-2"
              >
                Process
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
