/**
 * Domain types for passenger data.
 * Represents a demo passenger scenario loaded from passengers.json.
 */

export interface Passenger {
  id: string;
  name?: string;
  passport_name?: string;
  nationality?: string;
  passport_number?: string;
  date_of_birth?: string;
  gender?: string;
  passport_expiry?: string;
  issuing_country?: string;
  flight?: string;
  origin?: string;
  destination?: string;
  date?: string;
  departure?: string;
  terminal?: string;
  gate?: string;
  companion?: string | null;
  companion_seat?: string | null;
  assigned_seat?: string;
  checked_bag?: boolean;
  trip_days?: number;
  scenario: string;
  label: string;
  description: string;
  language?: string;
}

export interface ParsedPassport {
  fullName: string;
  surname: string;
  givenNames: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  gender: string;
  expiryDate: string;
  issuingCountry: string;
}
