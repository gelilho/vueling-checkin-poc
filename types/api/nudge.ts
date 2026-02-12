/**
 * API types for the generate-nudge endpoint.
 */

export type NudgeType = "bag_nudge" | "checkin_confirmation" | "document_issue";

export interface GenerateNudgeRequest {
  type: NudgeType;
  name?: string;
  flight_number?: string;
  origin?: string;
  destination?: string;
  date?: string;
  seat?: string;
  companion_info?: string;
  language?: string;
  // bag_nudge specific
  trip_days?: number;
  party_info?: string;
  // document_issue specific
  issue_type?: string;
  issue_details?: string;
  travel_date?: string;
}

export interface GenerateNudgeResponse {
  message: string;
}
