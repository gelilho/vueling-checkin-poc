/**
 * Domain types for flight data.
 * Represents flight details loaded from flights.json.
 */

export interface Flight {
  flight_number: string;
  origin: string;
  origin_city: string;
  destination: string;
  destination_city: string;
  date: string;
  departure_time: string;
  arrival_time: string;
  terminal: string;
  gate: string;
  aircraft: string;
  status: string;
}
