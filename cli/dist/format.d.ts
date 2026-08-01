import type { Diagnostic, ValidationModeResult } from '@lore/core';
export interface CliJsonOutput {
    mode: 'changed' | 'full';
    escalationReason: string | null;
    diagnostics: Diagnostic[];
    summary: ValidationModeResult['summary'];
}
export declare function toJsonOutput(result: ValidationModeResult): CliJsonOutput;
export declare function formatHuman(result: ValidationModeResult): string;
export declare function formatDiagnosticLine(diagnostic: Diagnostic): string;
//# sourceMappingURL=format.d.ts.map