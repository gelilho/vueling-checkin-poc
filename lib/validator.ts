import type { ValidationResult, ValidationIssue, RouteInfo } from "@/types";
import { isFuzzyMatch } from "@/lib/utils/string";
import routesData from "@/data/routes.json";

const routes = routesData as Record<string, RouteInfo>;

export function validatePassenger(
  passportExpiry: string,
  nationality: string,
  passportName: string,
  bookingName: string,
  destination: string,
  travelDate: string,
  passportNumber?: string,
  dateOfBirth?: string
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const route = routes[destination];

  // --- 1. Document number format check (passport, DNI, NIE) ---
  if (passportNumber) {
    const cleaned = passportNumber.replace(/[\s-]/g, "");
    const isDNI = /^\d{8}[A-Z]$/i.test(cleaned);
    const isNIE = /^[XYZ]\d{7}[A-Z]$/i.test(cleaned);
    const isPassport = cleaned.length >= 5 && cleaned.length <= 12 && /^[A-Z0-9]+$/i.test(cleaned);

    if (!isDNI && !isNIE && !isPassport) {
      issues.push({
        type: "invalid_passport_number",
        severity: "error",
        details: `Document number "${passportNumber}" is invalid. Accepted: passport (5-12 alphanum), DNI (8 digits + letter), or NIE (X/Y/Z + 7 digits + letter).`,
      });
    }
  }

  // --- 2. Expiry date validity check ---
  const expiryDate = new Date(passportExpiry);
  if (!passportExpiry || isNaN(expiryDate.getTime())) {
    issues.push({
      type: "invalid_expiry_date",
      severity: "error",
      details: "Passport expiry date is missing or invalid.",
    });
  }

  // --- 3. Date of birth validity + age >= 18 check ---
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      issues.push({
        type: "invalid_dob",
        severity: "error",
        details: "Date of birth is invalid.",
      });
    } else {
      // Age check: must be at least 18 at travel date
      const travel = new Date(travelDate);
      const ageDiff = travel.getFullYear() - dob.getFullYear();
      const monthDiff = travel.getMonth() - dob.getMonth();
      const dayDiff = travel.getDate() - dob.getDate();
      const age = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? ageDiff - 1 : ageDiff;

      if (age < 18) {
        issues.push({
          type: "underage",
          severity: "error",
          details: `Passenger is ${age} years old. Must be at least 18 for automatic check-in.`,
        });
      }
    }
  }

  if (!route) {
    return {
      valid: issues.filter((i) => i.severity === "error").length === 0,
      issues,
    };
  }

  // --- 4. Passport expiry vs route requirements ---
  if (!isNaN(expiryDate.getTime())) {
    const travel = new Date(travelDate);
    const requiredMonths = route.passport_validity_months;
    const requiredDate = new Date(travel);
    requiredDate.setMonth(requiredDate.getMonth() + requiredMonths);

    if (expiryDate < requiredDate) {
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - travel.getTime()) / (1000 * 60 * 60 * 24)
      );
      issues.push({
        type: "passport_expiry",
        severity: "error",
        details: daysUntilExpiry < 0
          ? `Passport expired ${Math.abs(daysUntilExpiry)} days ago. ${route.country} requires at least ${requiredMonths} months validity from travel date.`
          : `Passport expires in ${daysUntilExpiry} days. ${route.country} requires at least ${requiredMonths} months validity from travel date.`,
      });
    }
  }

  // --- 5. ETIAS check ---
  if (route.etias_required_from.includes(nationality)) {
    issues.push({
      type: "etias_required",
      severity: "warning",
      details: `${nationality} nationals need ETIAS authorization to enter ${route.country}. Make sure your ETIAS is approved before travel.`,
    });
  }

  // --- 6. eVisitor check (UK specific) ---
  if (route.evisitor_required?.includes(nationality)) {
    issues.push({
      type: "evisitor_required",
      severity: "warning",
      details: `${nationality} nationals need an Electronic Travel Authorization (ETA) to enter the ${route.country}. Apply online before travel.`,
    });
  }

  // --- 7. Name matching ---
  const normalizedPassport = passportName.toUpperCase().replace(/[^A-Z ]/g, "");
  const normalizedBooking = bookingName.toUpperCase().replace(/[^A-Z ]/g, "");

  const bookingWords = normalizedBooking.split(/\s+/);
  const passportWords = normalizedPassport.split(/[\s,]+/);
  const missingWords = bookingWords.filter(
    (w) => !passportWords.some((pw) => isFuzzyMatch(pw, w))
  );

  if (missingWords.length > 0) {
    issues.push({
      type: "name_mismatch",
      severity: "warning",
      details: `Name on booking "${bookingName}" may not match passport "${passportName}". Please verify.`,
    });
  }

  return {
    valid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
  };
}
