"use client";

import type { PassengerCheckInStatus } from "@/types";

interface FlightPassengerSummary {
  id: string;
  name: string;
  status: PassengerCheckInStatus;
}

interface FlightCardProps {
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  date: string;
  departureTime: string;
  passengers: FlightPassengerSummary[];
  isSelected: boolean;
  onSelect: () => void;
}

export default function FlightCard({
  flightNumber,
  origin,
  originCity,
  destination,
  destinationCity,
  date,
  departureTime,
  passengers,
  isSelected,
  onSelect,
}: FlightCardProps) {
  const checkedIn = passengers.filter((p) => p.status === "checked-in").length;
  const total = passengers.length;
  const progressPct = total > 0 ? (checkedIn / total) * 100 : 0;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
        isSelected
          ? "border-vueling-yellow bg-vueling-yellow/5 shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      {/* Flight header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-vueling-dark">{flightNumber}</span>
          <span className="text-[10px] font-mono bg-gray-100 text-vueling-gray px-1.5 py-0.5 rounded">
            {date}
          </span>
        </div>
        <span className="text-xs text-vueling-gray">{departureTime}</span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm">
          <span className="font-semibold text-vueling-dark">{origin}</span>
          <span className="text-vueling-gray text-xs ml-1">{originCity}</span>
        </div>
        <svg className="w-4 h-4 text-vueling-gray shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
        <div className="text-sm">
          <span className="font-semibold text-vueling-dark">{destination}</span>
          <span className="text-vueling-gray text-xs ml-1">{destinationCity}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-vueling-green rounded-full transition-all duration-500 animate-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold text-vueling-gray whitespace-nowrap">
          {checkedIn}/{total} checked in
        </span>
      </div>
    </button>
  );
}
