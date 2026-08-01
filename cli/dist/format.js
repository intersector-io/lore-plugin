export function toJsonOutput(result) {
    return {
        mode: result.mode,
        escalationReason: result.escalationReason,
        diagnostics: result.diagnostics,
        summary: result.summary,
    };
}
export function formatHuman(result) {
    const lines = [];
    lines.push(result.mode === 'full'
        ? result.escalationReason
            ? `Mode: full (escalated: ${result.escalationReason})`
            : 'Mode: full'
        : 'Mode: changed');
    for (const diagnostic of result.diagnostics) {
        lines.push(formatDiagnosticLine(diagnostic));
    }
    const { errors, warnings, files } = result.summary;
    lines.push('');
    lines.push(`Checked ${files} record${files === 1 ? '' : 's'}: ${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}.`);
    return lines.join('\n');
}
export function formatDiagnosticLine(diagnostic) {
    const location = diagnostic.pointer ? `${diagnostic.file}${diagnostic.pointer}` : diagnostic.file;
    return `${diagnostic.severity.toUpperCase()} [${diagnostic.rule}] ${location}: ${diagnostic.message}`;
}
//# sourceMappingURL=format.js.map