/**
 * API types for the generate-briefing endpoint.
 */

export interface GenerateBriefingRequest {
  name: string;
  flight_number: string;
  origin: string;
  destination: string;
  date: string;
  departure_time: string;
  terminal: string;
  gate: string;
  doc_status?: string;
  bag_status?: string;
  party_info?: string;
  security_estimate?: string;
  language?: string;
}

export interface BriefingData {
  summary: string;
  suggested_arrival: string;
  arrival_reasoning: string;
  steps: string[];
  destination_tip: string;
}
