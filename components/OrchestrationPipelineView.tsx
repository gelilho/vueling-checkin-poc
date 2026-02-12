"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { Passenger, DeliveryChannel } from "@/types";
import { useOrchestrationPipeline } from "@/hooks/useOrchestrationPipeline";
import { ORCH_PIPELINE_CONFIG } from "@/constants";
import { formatDuration } from "@/lib/utils";
import PipelineStage from "./PipelineStage";
import DataReveal from "./DataReveal";
import BoardingPass from "./BoardingPass";

import passengersData from "@/data/passengers.json";
import flightsData from "@/data/flights.json";
import routesData from "@/data/routes.json";

type FlightsMap = Record<string, { flight_number: string; origin: string; origin_city: string; destination: string; destination_city: string; date: string; departure_time: string; terminal: string; gate: string }>;
type RoutesMap = Record<string, { city: string }>;

const allPassengers = passengersData as Passenger[];
const flights = flightsData as FlightsMap;
const routes = routesData as RoutesMap;

interface Props {
  passengerId: string;
  onComplete: (success: boolean) => void;
  onReset: () => void;
}

export default function OrchestrationPipelineView({
  passengerId,
  onComplete,
  onReset,
}: Props) {
  const passenger = useMemo(
    () => allPassengers.find((p) => p.id === passengerId),
    [passengerId]
  );
  const flight = passenger?.flight ? flights[passenger.flight] : null;
  const route = passenger?.destination ? routes[passenger.destination] : null;

  const buildContext = useCallback(() => {
    if (!passenger || !flight) {
      return {
        passengerId,
        isLiveScan: false,
        channels: ["email" as DeliveryChannel],
      };
    }

    return {
      passengerId: passenger.id,
      isLiveScan: false,
      channels: (passenger.delivery_preferences as DeliveryChannel[]) || ["email" as DeliveryChannel, "push" as DeliveryChannel],
      name: passenger.name,
      passportName: passenger.passport_name,
      nationality: passenger.nationality,
      passportNumber: passenger.passport_number,
      passportExpiry: passenger.passport_expiry,
      dateOfBirth: passenger.date_of_birth,
      gender: passenger.gender,
      issuingCountry: passenger.issuing_country,
      flight: passenger.flight,
      origin: passenger.origin,
      destination: passenger.destination,
      destinationCity: route?.city || flight.destination_city || passenger.destination,
      date: passenger.date,
      departure: passenger.departure,
      terminal: passenger.terminal,
      gate: passenger.gate,
      seat: passenger.assigned_seat,
      companion: passenger.companion,
      companionSeat: passenger.companion_seat,
      checkedBag: passenger.checked_bag,
      tripDays: passenger.trip_days,
      language: passenger.language,
      scenario: passenger.scenario,
      pnr: passenger.pnr,
      bookingDate: passenger.booking_date,
      loyaltyTier: passenger.loyalty_tier,
      deliveryPreferences: passenger.delivery_preferences as DeliveryChannel[] | undefined,
    };
  }, [passenger, flight, route, passengerId]);

  const {
    state,
    confirmationMessage,
    issueMessage,
    bagNudge,
    checkinValid,
    runOrchestration,
    getStageDuration,
    totalDuration,
  } = useOrchestrationPipeline(buildContext);

  // Auto-start pipeline
  useEffect(() => {
    if (state.currentStage === "idle") {
      runOrchestration();
    }
  }, [state.currentStage, runOrchestration]);

  // Notify parent on completion
  useEffect(() => {
    if (state.currentStage === "done") {
      const timer = setTimeout(() => onComplete(checkinValid), 2000);
      return () => clearTimeout(timer);
    }
  }, [state.currentStage, checkinValid, onComplete]);

  if (!passenger || !flight) return null;

  const { stageOrder, stageMeta } = ORCH_PIPELINE_CONFIG;

  return (
    <div className="animate-fade-in">
      {/* Passenger header */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white border border-gray-100">
        <div className="w-10 h-10 rounded-full bg-vueling-yellow/20 flex items-center justify-center text-lg">
          👤
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-vueling-dark truncate">
            {passenger.name}
          </p>
          <p className="text-xs text-vueling-gray">
            {flight.flight_number} · {flight.origin} → {flight.destination} · {flight.date}
          </p>
        </div>
      </div>

      {/* Pipeline stages */}
      <div className="mb-4">
        {stageOrder.map((stageId, idx) => {
          const meta = stageMeta[stageId];
          const stageState = state.stages[stageId];
          if (!stageState || !meta) return null;

          return (
            <PipelineStage
              key={stageId}
              title={meta.title}
              icon={meta.icon}
              status={stageState.status}
              duration={getStageDuration(stageId)}
              isLast={idx === stageOrder.length - 1}
            >
              {/* Data reveal for each stage */}
              {stageState.data && (
                <DataReveal
                  fields={Object.entries(stageState.data).map(([label, value]) => ({
                    label,
                    value,
                  }))}
                  staggerMs={200}
                />
              )}

              {/* Auto check-in: confirmation or issue message */}
              {stageId === "auto-checkin" && checkinValid && confirmationMessage && stageState.status === "completed" && (
                <div className="mt-2 p-2 rounded-lg bg-vueling-yellow/10 border border-vueling-yellow/30">
                  <p className="text-xs text-vueling-dark">{confirmationMessage}</p>
                </div>
              )}
              {stageId === "auto-checkin" && !checkinValid && issueMessage && (
                <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-xs text-red-700">{issueMessage}</p>
                </div>
              )}

              {/* Post check-in: boarding pass + bag nudge */}
              {stageId === "post-checkin-comms" && stageState.status === "completed" && (
                <>
                  <div className="mt-3 animate-scale-in">
                    <BoardingPass
                      passengerName={passenger.name || ""}
                      flight={flight.flight_number}
                      origin={flight.origin}
                      originCity={flight.origin_city}
                      destination={flight.destination}
                      destinationCity={route?.city || flight.destination_city}
                      date={flight.date}
                      departure={flight.departure_time}
                      seat={passenger.assigned_seat || ""}
                      gate={flight.gate}
                      terminal={flight.terminal}
                    />
                  </div>
                  {bagNudge && (
                    <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1">
                        Smart Nudge
                      </p>
                      <p className="text-xs text-blue-900">{bagNudge}</p>
                    </div>
                  )}
                </>
              )}
            </PipelineStage>
          );
        })}
      </div>

      {/* Completion */}
      {state.currentStage === "done" && totalDuration != null && (
        <div className="mt-4 text-center animate-slide-up">
          <p className="text-sm font-semibold text-vueling-dark">
            Total pipeline time:{" "}
            <span className="font-mono text-vueling-green">
              {formatDuration(totalDuration)}
            </span>
          </p>
          <p className="text-xs text-vueling-gray mt-1">
            Zero passenger action required
          </p>
          <button
            onClick={onReset}
            className="mt-3 text-xs font-semibold text-vueling-dark border border-vueling-dark/20 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to roster
          </button>
        </div>
      )}
    </div>
  );
}
