/**
 * Scenario metadata for the passenger selector.
 * Maps scenario IDs to visual properties.
 */

export interface ScenarioMeta {
  color: string;
  icon: string;
}

export const SCENARIO_META: Record<string, ScenarioMeta> = {
  happy_path: {
    color: "border-vueling-green/30 bg-green-50",
    icon: "✈️",
  },
  family_no_bag: {
    color: "border-blue-200 bg-blue-50",
    icon: "👨‍👩‍👧‍👦",
  },
  live_scan: {
    color: "border-vueling-yellow/50 bg-vueling-yellow/10",
    icon: "📸",
  },
};
