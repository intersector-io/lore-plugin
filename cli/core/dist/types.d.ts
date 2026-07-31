/**
 * Diagnostics are the product's first API (PRD.md §13.11, docs/issues/0001).
 * Shape is frozen: CLI and any future consumer (K2 `validate_record`) depend
 * on it verbatim.
 */
export type Severity = 'error' | 'warning';
export interface Diagnostic {
    rule: string;
    severity: Severity;
    file: string;
    pointer: string;
    message: string;
}
export interface ValidationSummary {
    errors: number;
    warnings: number;
    files: number;
}
export interface ValidationResult {
    diagnostics: Diagnostic[];
    summary: ValidationSummary;
}
//# sourceMappingURL=types.d.ts.map