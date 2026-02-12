/**
 * Domain types for route/destination data.
 * Represents destination rules loaded from routes.json.
 */

export interface RouteInfo {
  city: string;
  country: string;
  schengen: boolean;
  passport_validity_months: number;
  etias_required_from: string[];
  evisitor_required?: string[];
  security_avg_minutes: number;
  tips: string;
}
