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
  /** Optional: pass the full Passenger object directly (e.g. from booking data) */
  passengerData?: Passenger;
  onComplete: (success: boolean) => void;
  onReset: () => void;
}

export default function OrchestrationPipelineView({
  passengerId,
  passengerData,
  onComplete,
  onReset,
}: Props) {
  const passenger = useMemo(
    () => passengerData || allPassengers.find((p) => p.id === passengerId),
    [passengerId, passengerData]
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
    nudgeMessage,
    nudgeAiGenerated,
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

  // No auto-advance: user clicks "Back to roster" to return and pick next passenger

  if (!passenger || !flight) return null;

  const { stageOrder, stageMeta } = ORCH_PIPELINE_CONFIG;
  const pipelineDone = state.currentStage === "done";

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
              forceExpand={pipelineDone}
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

              {/* Post check-in: boarding pass */}
              {stageId === "post-checkin-comms" && stageState.status === "completed" && (
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
              )}

              {/* AI Smart Nudge: clearly marked AI-generated content */}
              {stageId === "ai-push-nudge" && stageState.status === "completed" && nudgeMessage && (
                <div className={`mt-3 p-3 rounded-lg bg-gradient-to-br ${
                  checkinValid
                    ? "from-purple-50 to-blue-50 border border-purple-200/50"
                    : "from-amber-50 to-red-50 border border-red-200/50"
                }`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                      checkinValid ? "text-purple-600" : "text-red-600"
                    }`}>
                      {checkinValid ? "✦ AI-Generated Content" : "⚠ AI-Generated Alert"}
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${
                      checkinValid
                        ? "bg-purple-100 text-purple-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {nudgeAiGenerated ? "Gemini 2.0" : "Fallback"}
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-lg bg-white/70 ${
                    checkinValid ? "border border-purple-100" : "border border-red-100"
                  }`}>
                    <p className="text-xs text-vueling-dark leading-relaxed">{nudgeMessage}</p>
                  </div>
                  <p className={`text-[8px] mt-1.5 italic ${
                    checkinValid ? "text-purple-400" : "text-red-400"
                  }`}>
                    {checkinValid
                      ? "Push notification ready to deliver to passenger"
                      : "Action required notification sent to passenger"
                    }
                  </p>
                </div>
              )}
            </PipelineStage>
          );
        })}
      </div>

      {/* Completion */}
      {pipelineDone && totalDuration != null && (
        <div className="mt-6 animate-slide-up">
          {/* Summary bar — different styling for success vs blocked */}
          {checkinValid ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-vueling-green/5 border border-vueling-green/20 mb-4">
              <div>
                <p className="text-sm font-semibold text-vueling-dark">
                  ✓ Pipeline complete
                </p>
                <p className="text-xs text-vueling-gray mt-0.5">
                  Zero passenger action required
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-mono font-bold text-vueling-green">
                  {formatDuration(totalDuration)}
                </p>
                <p className="text-[10px] text-vueling-gray">total time</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
              <div>
                <p className="text-sm font-semibold text-red-700">
                  ✗ Check-in blocked
                </p>
                <p className="text-xs text-red-500 mt-0.5">
                  Action required — nudge sent to passenger
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-mono font-bold text-red-400">
                  {formatDuration(totalDuration)}
                </p>
                <p className="text-[10px] text-vueling-gray">total time</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                onComplete(checkinValid);
                onReset();
              }}
              className="flex-1 py-3 text-sm font-semibold text-vueling-dark bg-vueling-yellow rounded-xl active:scale-[0.97] transition-transform"
            >
              ← Back to roster
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
