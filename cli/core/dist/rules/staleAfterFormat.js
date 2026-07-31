import { isIsoDate, readField } from './fieldHelpers.js';
/**
 * Top-level `stale_after` (OKF 0.2 lifecycle family): an author-declared
 * expiry date — the record is stale once `today >= stale_after`. The one
 * OKF 0.2 field that stores a genuinely non-derivable fact (issue 0101), so
 * ADR-0001 welcomes it. Absolute `YYYY-MM-DD` only, per the spec — a plain
 * date comparison, no TTL arithmetic. Optional; absence is not an error.
 */
export const staleAfterFormat = {
    name: 'record/stale-after-format',
    check(ctx) {
        const value = readField(ctx.frontmatter.value, ['stale_after']);
        if (value === undefined || value === null || isIsoDate(value))
            return [];
        return [
            {
                rule: 'record/stale-after-format',
                severity: 'error',
                file: ctx.file,
                pointer: '/stale_after',
                message: `\`stale_after\` must be an absolute \`YYYY-MM-DD\` date (OKF 0.2): got "${String(value)}".`,
            },
        ];
    },
};
//# sourceMappingURL=staleAfterFormat.js.map