/**
 * API types for the document scanning endpoint (/api/scan-passport).
 * Supports passports, Spanish DNI, NIE, and EU ID cards.
 */

export type DocumentType = "passport" | "dni" | "nie" | "id_card";

export interface PassportScanResponse {
  success: boolean;
  data?: {
    fullName: string;
    surname: string;
    givenNames: string;
    passportNumber: string;
    nationality: string;
    dateOfBirth: string;
    gender: string;
    expiryDate: string;
    issuingCountry: string;
    documentType?: DocumentType;
  };
  error?: string;
}

/** Raw response from Gemini vision for document reading */
export interface GeminiPassportData {
  success: boolean;
  document_type?: string;
  full_name?: string;
  surname?: string;
  given_names?: string;
  passport_number?: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: string;
  expiry_date?: string;
  issuing_country?: string;
  error?: string;
}
