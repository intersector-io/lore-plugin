import { readField } from './fieldHelpers.js';
const ISO_8601_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
/**
 * Top-level `timestamp` (OKF: last meaningful change) must be ISO-8601 when
 * present (PRD.md §7.1). Optional field — absence is not an error here.
 */
export const timestampFormat = {
    name: 'record/timestamp-format',
    check(ctx) {
        const value = readField(ctx.frontmatter.value, ['timestamp']);
        if (value === undefined || value === null)
            return [];
        if (typeof value === 'string' && ISO_8601_PATTERN.test(value) && !Number.isNaN(Date.parse(value))) {
            return [];
        }
        return [
            {
                rule: 'record/timestamp-format',
                severity: 'error',
                file: ctx.file,
                pointer: '/timestamp',
                message: `\`timestamp\` must be an ISO-8601 date or datetime: got "${String(value)}".`,
            },
        ];
    },
};
//# sourceMappingURL=timestampFormat.js.map