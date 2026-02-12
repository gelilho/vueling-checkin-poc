"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { Passenger } from "@/types";
import type { PassengerCheckInStatus } from "@/types";
import { getLatestSubmission } from "@/lib/utils/storage";
import type { CheckInSubmission } from "@/lib/utils/storage";
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
    nationality: "—",
    passport_number: sub.passportNumber || "—",
    date_of_birth: "—",
    gender: "—",
    passport_expiry: sub.expiryDate || "2028-01-01",
    issuing_country: "—",
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

  // Auto-advance to next passenger when one completes (batch mode)
  const handleBatchNext = useCallback(
    (completedId: string, success: boolean) => {
      handleComplete(completedId, success);
      if (selectedGroup) {
        const remaining = selectedGroup.passengers.find(
          (p) =>
            p.id !== completedId &&
            (getStatus(p.id) === "ready" || getStatus(p.id) === "pending")
        );
        if (remaining) {
          setTimeout(() => handleProcess(remaining.id), 600);
        }
      }
    },
    [selectedGroup, getStatus, handleComplete, handleProcess]
  );

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
              handleBatchNext(processingId, success)
            }
            onReset={() => setProcessingId(null)}
          />
        )}

        {/* Footer link to demo */}
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
