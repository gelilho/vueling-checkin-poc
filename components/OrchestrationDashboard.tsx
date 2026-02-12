"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { Passenger } from "@/types";
import type { PassengerCheckInStatus } from "@/types";
import { getLatestSubmission } from "@/lib/utils/storage";
import type { CheckInSubmission } from "@/lib/utils/storage";
import {
  getPassengerPipelineStatus,
  getPipelineExecutionCount,
  getPipelineExecutions,
  downloadPipelineExecutionsCSV,
} from "@/lib/utils/pipeline-log-storage";
import type { PipelineExecutionLog } from "@/lib/utils/pipeline-log-storage";
import FlightCard from "./FlightCard";
import PassengerRoster from "./PassengerRoster";
import type { RosterPassenger } from "./PassengerRoster";
import OrchestrationPipelineView from "./OrchestrationPipelineView";

import passengersData from "@/data/passengers.json";
import flightsData from "@/data/flights.json";
import routesData from "@/data/routes.json";

type FlightsMap = Record<string, { flight_number: string; origin: string; origin_city: string; destination: string; destination_city: string; date: string; departure_time: string; terminal: string; gate: string }>;
type RoutesMap = Record<string, { city: string }>;

const flights = flightsData as FlightsMap;
const routes = routesData as RoutesMap;
const allPassengers = passengersData as Passenger[];
const staticPassengers = allPassengers.filter((p) => p.id !== "custom");

/** Convert a localStorage booking submission into a Passenger object */
function submissionToPassenger(sub: CheckInSubmission): Passenger {
  const channels = sub.deliveryChannels.split(";").filter(Boolean);
  return {
    id: `booking-${sub.timestamp}`,
    name: sub.fullName || "Booking Passenger",
    passport_name: (sub.fullName || "").toUpperCase(),
    nationality: sub.nationality || "—",
    passport_number: sub.passportNumber || "—",
    date_of_birth: sub.dateOfBirth || "—",
    gender: "—",
    passport_expiry: sub.expiryDate || "2028-01-01",
    issuing_country: sub.issuingCountry || "—",
    flight: "VY1234",
    origin: "BCN",
    destination: "FCO",
    date: "2026-03-15",
    departure: "16:35",
    terminal: "T1",
    gate: "B34",
    companion: null,
    companion_seat: null,
    assigned_seat: "14C",
    checked_bag: false,
    trip_days: 5,
    scenario: "booking_submission",
    label: `${sub.fullName || "Passenger"} — From Booking`,
    description: `Submitted via ${sub.entryMethod} entry`,
    language: "en",
    pnr: sub.pnr || "VY-B2026X",
    booking_date: sub.timestamp.split("T")[0],
    loyalty_tier: null,
    delivery_preferences: channels.length > 0 ? channels : ["email", "push"],
  };
}

interface FlightGroup {
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  date: string;
  departureTime: string;
  passengers: Passenger[];
}

function groupByFlight(pax: Passenger[]): FlightGroup[] {
  const groups: Record<string, FlightGroup> = {};
  for (const p of pax) {
    if (!p.flight) continue;
    const f = flights[p.flight];
    if (!f) continue;
    if (!groups[p.flight]) {
      const route = routes[f.destination];
      groups[p.flight] = {
        flightNumber: f.flight_number,
        origin: f.origin,
        originCity: f.origin_city,
        destination: f.destination,
        destinationCity: route?.city || f.destination_city || f.destination,
        date: f.date,
        departureTime: f.departure_time,
        passengers: [],
      };
    }
    groups[p.flight].passengers.push(p);
  }
  return Object.values(groups);
}

interface Props {
  onReset?: () => void;
}

export default function OrchestrationDashboard({ onReset }: Props) {
  const [bookingPassenger, setBookingPassenger] = useState<Passenger | null>(null);

  // Load booking data from localStorage on mount
  useEffect(() => {
    const latest = getLatestSubmission();
    if (latest && latest.fullName) {
      setBookingPassenger(submissionToPassenger(latest));
    }
  }, []);

  const passengers = useMemo(() => {
    const base = [...staticPassengers];
    if (bookingPassenger) {
      // Inject booking passenger into the VY1234 flight (same as María)
      base.push(bookingPassenger);
    }
    return base;
  }, [bookingPassenger]);

  const flightGroups = useMemo(() => groupByFlight(passengers), [passengers]);
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, PassengerCheckInStatus>>({});
  const [executionCount, setExecutionCount] = useState(0);
  const [executions, setExecutions] = useState<PipelineExecutionLog[]>([]);

  // Load persisted pipeline statuses from localStorage on mount
  useEffect(() => {
    const loaded: Record<string, PassengerCheckInStatus> = {};
    for (const group of flightGroups) {
      for (const p of group.passengers) {
        const saved = getPassengerPipelineStatus(p.id);
        if (saved) loaded[p.id] = saved;
      }
    }
    if (Object.keys(loaded).length > 0) {
      setStatuses((prev) => ({ ...loaded, ...prev }));
    }
    setExecutionCount(getPipelineExecutionCount());
    setExecutions(getPipelineExecutions());
  }, [flightGroups]);

  const selectedGroup = flightGroups.find(
    (g) => g.flightNumber === selectedFlight
  );

  const getStatus = useCallback(
    (id: string): PassengerCheckInStatus => statuses[id] || "ready",
    [statuses]
  );

  const handleProcess = useCallback((passengerId: string) => {
    setProcessingId(passengerId);
    setStatuses((prev) => ({ ...prev, [passengerId]: "processing" }));
  }, []);

  const handleComplete = useCallback((passengerId: string, success: boolean) => {
    setStatuses((prev) => ({
      ...prev,
      [passengerId]: success ? "checked-in" : "blocked",
    }));
    setProcessingId(null);
    // Refresh execution data after pipeline saves
    setTimeout(() => {
      setExecutionCount(getPipelineExecutionCount());
      setExecutions(getPipelineExecutions());
    }, 100);
  }, []);

  const handleProcessAll = useCallback(() => {
    if (!selectedGroup) return;
    const firstReady = selectedGroup.passengers.find(
      (p) => getStatus(p.id) === "ready" || getStatus(p.id) === "pending"
    );
    if (firstReady) {
      handleProcess(firstReady.id);
    }
  }, [selectedGroup, getStatus, handleProcess]);

  // No auto-advance — each passenger stops independently after pipeline completes

  const rosterPassengers: RosterPassenger[] = useMemo(
    () =>
      (selectedGroup?.passengers || []).map((p) => ({
        id: p.id,
        name: p.name || "Unknown",
        passportNumber: p.passport_number,
        checkedBag: p.checked_bag,
        status: getStatus(p.id),
        fromBooking: p.id.startsWith("booking-"),
      })),
    [selectedGroup, getStatus]
  );

  return (
    <div className="min-h-screen bg-vueling-light">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Hero */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-vueling-yellow/20 text-vueling-dark px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-vueling-green animate-status-pulse" />
            T-48h Automated Pipeline
          </div>
          <h1 className="text-2xl font-bold text-vueling-dark">
            Check-In Orchestration
          </h1>
          <p className="text-sm text-vueling-gray mt-1">
            Automated passenger processing for upcoming flights
          </p>
        </div>

        {/* Flight cards */}
        <div className="space-y-3 mb-4">
          {flightGroups.map((group) => (
            <FlightCard
              key={group.flightNumber}
              flightNumber={group.flightNumber}
              origin={group.origin}
              originCity={group.originCity}
              destination={group.destination}
              destinationCity={group.destinationCity}
              date={group.date}
              departureTime={group.departureTime}
              passengers={group.passengers.map((p) => ({
                id: p.id,
                name: p.name || "Unknown",
                status: getStatus(p.id),
              }))}
              isSelected={selectedFlight === group.flightNumber}
              onSelect={() =>
                setSelectedFlight(
                  selectedFlight === group.flightNumber
                    ? null
                    : group.flightNumber
                )
              }
            />
          ))}
        </div>

        {/* Pipeline execution log summary */}
        {executionCount > 0 && !processingId && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 mb-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-vueling-green/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-vueling-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-vueling-dark">
                  {executionCount} pipeline execution{executionCount !== 1 ? "s" : ""} logged
                </p>
                <p className="text-[10px] text-vueling-gray">All stages & timestamps stored</p>
              </div>
            </div>
            <button
              onClick={() => downloadPipelineExecutionsCSV()}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-vueling-dark text-white
                hover:bg-vueling-dark/80 transition-all flex items-center gap-1.5"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        )}

        {/* Passenger roster */}
        {selectedGroup && !processingId && (
          <PassengerRoster
            passengers={rosterPassengers}
            processingId={processingId}
            onProcess={handleProcess}
            onProcessAll={handleProcessAll}
          />
        )}

        {/* Pipeline view for processing passenger */}
        {processingId && selectedGroup && (
          <OrchestrationPipelineView
            passengerId={processingId}
            passengerData={
              bookingPassenger && processingId === bookingPassenger.id
                ? bookingPassenger
                : undefined
            }
            onComplete={(success) =>
              handleComplete(processingId, success)
            }
            onReset={() => setProcessingId(null)}
          />
        )}

        {/* CSV Data Visor — pipeline execution log */}
        {executions.length > 0 && !processingId && (
          <div className="mt-6 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-vueling-dark uppercase tracking-wider">
                Pipeline Execution Log
              </h3>
              <button
                onClick={() => downloadPipelineExecutionsCSV()}
                className="text-[10px] font-semibold px-2 py-1 rounded-md bg-vueling-dark text-white
                  hover:bg-vueling-dark/80 transition-all flex items-center gap-1"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV
              </button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_70px_70px_60px] gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200">
                <span className="text-[9px] font-bold text-vueling-gray uppercase">Passenger</span>
                <span className="text-[9px] font-bold text-vueling-gray uppercase">Flight</span>
                <span className="text-[9px] font-bold text-vueling-gray uppercase">Duration</span>
                <span className="text-[9px] font-bold text-vueling-gray uppercase text-right">Status</span>
              </div>

              {/* Rows */}
              {executions.map((exec) => (
                <details key={exec.id} className="group border-b border-gray-100 last:border-0">
                  <summary className="grid grid-cols-[1fr_70px_70px_60px] gap-1 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors items-center">
                    <span className="text-[11px] font-medium text-vueling-dark truncate">
                      {exec.passengerName}
                    </span>
                    <span className="text-[10px] text-vueling-gray font-mono">
                      {exec.flight}
                    </span>
                    <span className="text-[10px] text-vueling-gray font-mono">
                      {(exec.totalDurationMs / 1000).toFixed(1)}s
                    </span>
                    <span className={`text-[9px] font-bold text-right ${
                      exec.result === "checked-in" ? "text-vueling-green" : "text-red-500"
                    }`}>
                      {exec.result === "checked-in" ? "✓ Done" : "✗ Blocked"}
                    </span>
                  </summary>

                  {/* Stage details */}
                  <div className="px-3 pb-2 pt-1 bg-gray-50/50">
                    <div className="text-[9px] text-vueling-gray mb-1 font-mono">
                      {new Date(exec.startedAt).toLocaleString()}
                    </div>
                    {exec.stages.map((stage) => (
                      <div
                        key={stage.stageId}
                        className="flex items-center gap-2 py-0.5"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          stage.status === "completed"
                            ? "bg-vueling-green"
                            : stage.status === "error"
                              ? "bg-red-400"
                              : "bg-gray-300"
                        }`} />
                        <span className="text-[10px] text-vueling-dark flex-1 truncate">
                          {stage.stageTitle}
                        </span>
                        <span className="text-[9px] text-vueling-gray font-mono">
                          {stage.durationMs}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>

            <p className="text-[9px] text-vueling-gray mt-1.5 text-center">
              {executions.length} execution{executions.length !== 1 ? "s" : ""} stored · All data persisted locally
            </p>
          </div>
        )}

        {/* Footer link */}
        {onReset && (
          <div className="text-center mt-8">
            <button
              onClick={onReset}
              className="text-xs text-vueling-gray hover:text-vueling-dark transition-colors"
            >
              ← Back to navigation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
