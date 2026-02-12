/**
 * Orchestration-specific types.
 * Used by the T-48h automated check-in dashboard.
 */

import type { PipelineState } from "./pipeline";

/** Status of an individual passenger in the orchestration batch */
export type PassengerCheckInStatus =
  | "pending"       // Not yet processed
  | "missing-docs"  // Passport data incomplete
  | "ready"         // All data available, ready to process
  | "processing"    // Pipeline currently running
  | "checked-in"    // Successfully completed
  | "blocked";      // Pipeline hit a validation error

/** Passenger as viewed in the orchestration dashboard */
export interface OrchestrationPassenger {
  passengerId: string;
  name: string;
  flight: string;
  status: PassengerCheckInStatus;
  missingFields?: string[];
  pipelineState?: PipelineState;
}

/** Flight as viewed in the orchestration dashboard */
export interface OrchestrationFlight {
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureDate: string;
  departureTime: string;
  passengers: OrchestrationPassenger[];
  totalCheckedIn: number;
  totalPassengers: number;
}
