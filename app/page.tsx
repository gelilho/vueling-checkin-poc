"use client";

import { useState } from "react";
import PassengerSelector from "@/components/PassengerSelector";
import PipelineView from "@/components/PipelineView";

type AppPhase = "select" | "running";

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleReset() {
    setPhase("select");
    setSelectedId(null);
  }

  return (
    <div className="flex-1 flex flex-col px-5 py-6">
      {phase === "select" && (
        <>
          {/* Hero */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-vueling-dark leading-tight mb-2">
              Invisible Check-In
            </h1>
            <p className="text-vueling-gray text-sm leading-relaxed">
              What if check-in just disappeared? Select a passenger and watch
              the AI pipeline handle everything automatically.
            </p>
          </div>

          {/* Passenger selector */}
          <div className="mb-6">
            <p className="text-xs text-vueling-gray font-medium uppercase tracking-wider mb-3">
              Choose a scenario
            </p>
            <PassengerSelector
              selected={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          {/* Start button */}
          {selectedId && (
            <div className="animate-fade-in">
              <button
                onClick={() => setPhase("running")}
                className="w-full py-4 bg-vueling-yellow text-vueling-dark font-bold rounded-xl text-sm active:scale-[0.97] transition-transform shadow-lg shadow-vueling-yellow/20"
              >
                Start Journey
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-8 pb-4">
            <p className="text-center text-[10px] text-gray-300 uppercase tracking-widest">
              4YFN / MWC 2026 — Proof of Concept
            </p>
          </div>
        </>
      )}

      {phase === "running" && selectedId && (
        <PipelineView passengerId={selectedId} onReset={handleReset} />
      )}
    </div>
  );
}
