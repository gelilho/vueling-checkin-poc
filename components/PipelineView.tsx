"use client";

import { useCallback, useState } from "react";
import PipelineStage from "@/components/PipelineStage";
import DataReveal from "@/components/DataReveal";
import ChannelSelector from "@/components/ChannelSelector";
import LiveScanStage from "@/components/LiveScanStage";
import BoardingPass from "@/components/BoardingPass";
import { usePipeline } from "@/hooks/usePipeline";
import { formatDuration } from "@/lib/utils";
import { STAGE_ORDER, STAGE_META, LIVE_SCAN_DEFAULTS, DATA_REVEAL } from "@/constants";
import type { PipelineContext, Flight } from "@/types";
import passengers from "@/data/passengers.json";
import flights from "@/data/flights.json";
import routes from "@/data/routes.json";

interface PipelineViewProps {
  passengerId: string;
  onReset: () => void;
}

export default function PipelineView({ passengerId, onReset }: PipelineViewProps) {
  // Resolve passenger data
  const passenger = passengers.find((p) => p.id === passengerId);
  const isLiveScan = passengerId === "custom";
  const flight = passenger?.flight
    ? (flights as Record<string, Flight>)[passenger.flight]
    : null;
  const route = passenger?.destination
    ? (routes as Record<string, { city: string; security_avg_minutes: number }>)[passenger.destination]
    : null;

  // Live scan parsed data (set once scan completes)
  const [liveScanData, setLiveScanData] = useState<Record<string, string> | null>(null);

  // Build context from passenger data
  const buildContext = useCallback((): PipelineContext => {
    if (isLiveScan && liveScanData) {
      return {
        passengerId: "custom",
        isLiveScan: true,
        channels: [],  // overridden by hook
        name: liveScanData.fullName || "Traveler",
        passportName: liveScanData.fullName,
        nationality: liveScanData.nationality || "UNK",
        passportNumber: liveScanData.passportNumber,
        passportExpiry: liveScanData.expiryDate || "2030-01-01",
        dateOfBirth: liveScanData.dateOfBirth,
        gender: liveScanData.gender,
        issuingCountry: liveScanData.issuingCountry,
        flight: LIVE_SCAN_DEFAULTS.flight,
        origin: LIVE_SCAN_DEFAULTS.origin,
        destination: LIVE_SCAN_DEFAULTS.destination,
        destinationCity: LIVE_SCAN_DEFAULTS.destinationCity,
        date: LIVE_SCAN_DEFAULTS.date,
        departure: LIVE_SCAN_DEFAULTS.departure,
        terminal: LIVE_SCAN_DEFAULTS.terminal,
        gate: LIVE_SCAN_DEFAULTS.gate,
        seat: LIVE_SCAN_DEFAULTS.seat,
        companion: null,
        companionSeat: null,
        checkedBag: false,
        tripDays: LIVE_SCAN_DEFAULTS.tripDays,
        language: "en",
        scenario: "live_scan",
      };
    }

    return {
      passengerId: passenger?.id || "",
      isLiveScan: false,
      channels: [],  // overridden by hook
      name: passenger?.name || "",
      passportName: passenger?.passport_name || "",
      nationality: passenger?.nationality || "",
      passportNumber: passenger?.passport_number || "",
      passportExpiry: passenger?.passport_expiry || "",
      dateOfBirth: passenger?.date_of_birth || "",
      gender: passenger?.gender || "",
      issuingCountry: passenger?.issuing_country || passenger?.nationality || "",
      flight: passenger?.flight || "",
      origin: passenger?.origin || "",
      destination: passenger?.destination || "",
      destinationCity: route?.city || passenger?.destination || "",
      date: passenger?.date || "",
      departure: passenger?.departure || "",
      terminal: passenger?.terminal || "",
      gate: passenger?.gate || "",
      seat: passenger?.assigned_seat || "",
      companion: passenger?.companion || null,
      companionSeat: passenger?.companion_seat || null,
      checkedBag: passenger?.checked_bag ?? false,
      tripDays: passenger?.trip_days || 3,
      language: passenger?.language || "en",
      scenario: passenger?.scenario || "",
    };
  }, [passenger, isLiveScan, liveScanData, route]);

  const {
    state,
    channels,
    setChannels,
    confirmationMessage,
    issueMessage,
    bagNudge,
    checkinValid,
    runPipeline,
    resolveLiveScan,
    dispatch,
    getStageDuration,
    totalDuration,
  } = usePipeline(buildContext, isLiveScan, setLiveScanData);

  const pCtx = buildContext();

  return (
    <div className="flex flex-col">
      {/* Compact passenger header */}
      {passenger && !isLiveScan && (
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-vueling-dark truncate">{passenger.name}</p>
            <p className="text-xs text-vueling-gray">
              {passenger.flight} · {passenger.origin} → {route?.city || passenger.destination} · {passenger.date}
            </p>
          </div>
        </div>
      )}

      {isLiveScan && (
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
          <div className="flex-1">
            <p className="text-sm font-semibold text-vueling-dark">Live Passport Scan</p>
            <p className="text-xs text-vueling-gray">Scan your passport → auto check-in demo (VY1234 BCN→Rome)</p>
          </div>
        </div>
      )}

      {/* Pipeline stages */}
      {STAGE_ORDER.map((stageId, i) => (
        <PipelineStage
          key={stageId}
          title={STAGE_META[stageId].title}
          icon={STAGE_META[stageId].icon}
          status={state.stages[stageId].status}
          duration={getStageDuration(stageId)}
          isLast={i === STAGE_ORDER.length - 1}
        >
          {/* Stage 1: Channels */}
          {stageId === "channels" && (
            <>
              {state.stages.channels.status === "running" && state.currentStage === "idle" ? (
                <ChannelSelector selected={channels} onChange={setChannels} />
              ) : (
                <DataReveal
                  fields={Object.entries(state.stages.channels.data || {}).map(
                    ([label, value]) => ({ label, value })
                  )}
                  staggerMs={DATA_REVEAL.CHANNEL_STAGGER_MS}
                />
              )}
            </>
          )}

          {/* Stage 2: Identity Scan */}
          {stageId === "scan" && (
            <>
              {isLiveScan && state.stages.scan.status === "running" ? (
                <LiveScanStage
                  onScanComplete={(result) => {
                    resolveLiveScan(result);
                  }}
                  onError={(error) => {
                    dispatch({ type: "ERROR_STAGE", stage: "scan", error });
                  }}
                />
              ) : state.stages.scan.data ? (
                <DataReveal
                  fields={Object.entries(state.stages.scan.data).map(
                    ([label, value]) => ({ label, value })
                  )}
                  staggerMs={DATA_REVEAL.SCAN_STAGGER_MS}
                />
              ) : null}
            </>
          )}

          {/* Stage 3: Check-In */}
          {stageId === "checkin" && (
            <>
              {state.stages.checkin.data && (
                <DataReveal
                  fields={Object.entries(state.stages.checkin.data).map(
                    ([label, value]) => ({
                      label,
                      value,
                      highlight: value.startsWith("\u26A0\uFE0F"),
                    })
                  )}
                  staggerMs={DATA_REVEAL.CHECKIN_STAGGER_MS}
                />
              )}
              {/* AI confirmation message */}
              {checkinValid && confirmationMessage && state.stages.checkin.status === "completed" && (
                <div className="mt-3 rounded-lg bg-vueling-yellow/10 border border-vueling-yellow/30 p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded bg-vueling-yellow flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-vueling-dark font-bold text-[7px]">AI</span>
                    </div>
                    <p className="text-vueling-dark text-xs leading-relaxed">{confirmationMessage}</p>
                  </div>
                </div>
              )}
              {/* Issue message */}
              {!checkinValid && issueMessage && state.stages.checkin.status === "error" && (
                <div className="mt-3 rounded-lg bg-red-50 border border-red-100 p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded bg-vueling-red flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white font-bold text-[7px]">AI</span>
                    </div>
                    <p className="text-red-800 text-xs leading-relaxed">{issueMessage}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Stage 4: Delivery */}
          {stageId === "delivery" && (
            <>
              {state.stages.delivery.data && (
                <DataReveal
                  fields={Object.entries(state.stages.delivery.data).map(
                    ([label, value]) => ({ label, value })
                  )}
                  staggerMs={DATA_REVEAL.DELIVERY_STAGGER_MS}
                />
              )}
              {/* Boarding pass */}
              {state.stages.delivery.status === "completed" && flight && (
                <div className="mt-3 animate-scale-in">
                  <BoardingPass
                    passengerName={pCtx.name || "Traveler"}
                    flight={pCtx.flight || ""}
                    origin={pCtx.origin || ""}
                    originCity={flight.origin_city}
                    destination={pCtx.destination || ""}
                    destinationCity={flight.destination_city}
                    date={pCtx.date || ""}
                    departure={pCtx.departure || ""}
                    arrival={flight.arrival_time}
                    seat={pCtx.seat || ""}
                    gate={pCtx.gate || ""}
                    terminal={pCtx.terminal || ""}
                  />
                </div>
              )}
              {/* Bag nudge */}
              {bagNudge && state.stages.delivery.status === "completed" && (
                <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">🧳</span>
                    <div className="flex-1">
                      <p className="text-blue-800 text-xs leading-relaxed">{bagNudge}</p>
                      <button className="mt-2 text-[10px] font-medium text-blue-600 bg-blue-100 rounded-md px-2.5 py-1">
                        Add checked bag
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </PipelineStage>
      ))}

      {/* Pipeline complete */}
      {state.currentStage === "done" && totalDuration != null && (
        <div className="mt-4 text-center animate-slide-up" style={{ opacity: 0, animationDelay: "300ms" }}>
          <p className="text-xs text-vueling-gray">
            Total pipeline time:{" "}
            <span className="font-mono font-semibold text-vueling-dark">
              {formatDuration(totalDuration)}
            </span>
          </p>
          <p className="text-[10px] text-vueling-gray mt-0.5">
            Zero passenger action required
          </p>
          <button
            onClick={onReset}
            className="mt-4 px-6 py-2.5 bg-vueling-yellow text-vueling-dark font-semibold rounded-xl text-sm active:scale-[0.97] transition-transform"
          >
            Run another scenario
          </button>
        </div>
      )}

      {/* Start button — only shown before pipeline starts */}
      {state.currentStage === "idle" && (
        <div className="mt-6">
          <button
            onClick={runPipeline}
            className="w-full py-4 bg-vueling-yellow text-vueling-dark font-bold rounded-xl text-sm active:scale-[0.97] transition-transform shadow-lg shadow-vueling-yellow/20"
          >
            Start Journey
          </button>
        </div>
      )}
    </div>
  );
}
