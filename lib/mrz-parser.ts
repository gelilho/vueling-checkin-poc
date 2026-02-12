import type { ParsedPassport, GeminiPassportData } from "@/types";
import { UNKNOWN_COUNTRY_CODE } from "@/constants";

/**
 * Parse and validate Gemini-returned document data.
 * Handles passports (MRZ), Spanish DNI/NIE, and EU ID cards.
 */
export function parseAndValidateMRZ(data: GeminiPassportData): ParsedPassport | null {
  if (!data.success) return null;

  // For DNI/NIE we may not have all MRZ fields — be lenient
  const isDniNie = data.document_type === "dni" || data.document_type === "nie";

  // Minimum required: some name + document number
  if (!data.surname && !data.full_name) return null;
  if (!data.passport_number) return null;

  // For passports, expiry is mandatory; for DNI/NIE it may be missing
  if (!isDniNie && !data.expiry_date) return null;

  return {
    fullName: data.full_name || `${data.surname}, ${data.given_names}`,
    surname: data.surname || "",
    givenNames: data.given_names || "",
    passportNumber: data.passport_number,
    nationality: data.nationality || (isDniNie ? "ESP" : UNKNOWN_COUNTRY_CODE),
    dateOfBirth: data.date_of_birth || "",
    gender: data.gender || "",
    expiryDate: data.expiry_date || "",
    issuingCountry: data.issuing_country || data.nationality || (isDniNie ? "ESP" : UNKNOWN_COUNTRY_CODE),
  };
}
