/**
 * Local storage utility for passenger check-in submissions.
 * Stores data as CSV in localStorage so it persists across sessions
 * and can be exported/downloaded.
 */

const STORAGE_KEY = "vueling_checkin_submissions";

export interface CheckInSubmission {
  timestamp: string;
  pnr: string;
  flight: string;
  fullName: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  issuingCountry: string;
  expiryDate: string;
  entryMethod: "scan" | "manual";
  deliveryChannels: string;
  autoCheckIn: "yes" | "no";
}

const CSV_HEADERS: (keyof CheckInSubmission)[] = [
  "timestamp",
  "pnr",
  "flight",
  "fullName",
  "passportNumber",
  "nationality",
  "dateOfBirth",
  "issuingCountry",
  "expiryDate",
  "entryMethod",
  "deliveryChannels",
  "autoCheckIn",
];

/** Escape a CSV field (wrap in quotes if it contains comma, quote, or newline) */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Get all submissions from localStorage */
export function getSubmissions(): CheckInSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CheckInSubmission[];
  } catch {
    return [];
  }
}

/** Save a new submission to localStorage */
export function saveSubmission(submission: CheckInSubmission): void {
  if (typeof window === "undefined") return;
  const existing = getSubmissions();
  existing.push(submission);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

/** Convert all submissions to CSV string */
export function submissionsToCSV(): string {
  const rows = getSubmissions();
  if (rows.length === 0) return "";

  const header = CSV_HEADERS.join(",");
  const lines = rows.map((row) =>
    CSV_HEADERS.map((key) => escapeCSV(row[key] || "")).join(",")
  );

  return [header, ...lines].join("\n");
}

/** Download submissions as a .csv file */
export function downloadSubmissionsCSV(): void {
  const csv = submissionsToCSV();
  if (!csv) return;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vueling-checkin-submissions-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Clear all submissions */
export function clearSubmissions(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Get submission count */
export function getSubmissionCount(): number {
  return getSubmissions().length;
}

/** Get the latest submission (most recent booking) */
export function getLatestSubmission(): CheckInSubmission | null {
  const all = getSubmissions();
  if (all.length === 0) return null;
  return all[all.length - 1];
}
