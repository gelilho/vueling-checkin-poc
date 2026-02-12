/**
 * Domain types for document validation.
 */

export type ValidationIssueType =
  | "passport_expiry"
  | "etias_required"
  | "evisitor_required"
  | "name_mismatch";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  type: ValidationIssueType;
  severity: ValidationSeverity;
  details: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
