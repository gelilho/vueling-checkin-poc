import type { ParsedPassport, GeminiPassportData } from "@/types";
import { UNKNOWN_COUNTRY_CODE } from "@/constants";

// Parse and validate the Gemini-returned passport data
export function parseAndValidateMRZ(data: GeminiPassportData): ParsedPassport | null {
  if (!data.success || !data.surname || !data.passport_number || !data.expiry_date) {
    return null;
  }

  return {
    fullName: data.full_name || `${data.surname}, ${data.given_names}`,
    surname: data.surname,
    givenNames: data.given_names || "",
    passportNumber: data.passport_number,
    nationality: data.nationality || UNKNOWN_COUNTRY_CODE,
    dateOfBirth: data.date_of_birth || "",
    gender: data.gender || "",
    expiryDate: data.expiry_date,
    issuingCountry: data.issuing_country || data.nationality || UNKNOWN_COUNTRY_CODE,
  };
}
