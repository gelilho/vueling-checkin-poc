"use client";

import { SCENARIO_META } from "@/constants/scenarios";
import passengers from "@/data/passengers.json";
import routes from "@/data/routes.json";

interface PassengerSelectorProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function PassengerSelector({
  selected,
  onSelect,
}: PassengerSelectorProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory scrollbar-hide">
      {passengers.map((p) => {
        const isSelected = selected === p.id;
        const route = p.destination
          ? (routes as Record<string, { city: string }>)[p.destination]
          : null;
        const meta = SCENARIO_META[p.scenario];

        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`flex-shrink-0 w-[160px] snap-start rounded-xl border-2 p-3 text-left transition-all active:scale-[0.97] ${
              isSelected
                ? "border-vueling-yellow shadow-md shadow-vueling-yellow/20 scale-[1.02]"
                : meta?.color || "border-gray-200 bg-white"
            }`}
          >
            <span className="text-xl">{meta?.icon || "\u2708\uFE0F"}</span>
            <h3 className="text-xs font-semibold text-vueling-dark mt-2 leading-tight">
              {p.scenario === "live_scan"
                ? "Live Scan"
                : p.name?.split(" ")[0] || p.label}
            </h3>
            {p.origin && p.destination && (
              <p className="text-[10px] font-mono text-vueling-gray mt-1">
                {p.origin} → {p.destination}
              </p>
            )}
            <p className="text-[10px] text-vueling-gray mt-1 leading-snug line-clamp-2">
              {p.scenario === "live_scan"
                ? "Scan your passport"
                : route
                ? `To ${route.city}`
                : ""}
            </p>
          </button>
        );
      })}
    </div>
  );
}
