/**
 * API types for passport scanning endpoint.
 */

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
  };
  error?: string;
}

/** Raw response from Gemini vision for passport reading */
export interface GeminiPassportData {
  success: boolean;
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
