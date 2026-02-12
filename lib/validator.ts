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
  travelDate: string
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const route = routes[destination];

  if (!route) {
    return { valid: true, issues: [] };
  }

  // 1. Passport expiry check
  const expiryDate = new Date(passportExpiry);
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
      details: `Passport expires in ${daysUntilExpiry} days. ${route.country} requires at least ${requiredMonths} months validity from travel date.`,
    });
  }

  // 2. ETIAS check
  if (route.etias_required_from.includes(nationality)) {
    issues.push({
      type: "etias_required",
      severity: "warning",
      details: `${nationality} nationals need ETIAS authorization to enter ${route.country}. Make sure your ETIAS is approved before travel.`,
    });
  }

  // 3. eVisitor check (UK specific)
  if (route.evisitor_required?.includes(nationality)) {
    issues.push({
      type: "evisitor_required",
      severity: "warning",
      details: `${nationality} nationals need an Electronic Travel Authorization (ETA) to enter the ${route.country}. Apply online before travel.`,
    });
  }

  // 4. Name matching
  const normalizedPassport = passportName.toUpperCase().replace(/[^A-Z ]/g, "");
  const normalizedBooking = bookingName.toUpperCase().replace(/[^A-Z ]/g, "");

  // Simple check: all booking name words should appear in passport name
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
