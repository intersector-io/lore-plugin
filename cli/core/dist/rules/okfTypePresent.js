import { isNonEmptyString, readField } from './fieldHelpers.js';
/**
 * OKF-required: every record must declare its type (PRD.md §7.1).
 */
export const okfTypePresent = {
    name: 'okf-type-present',
    check(ctx) {
        const value = readField(ctx.frontmatter.value, ['type']);
        if (isNonEmptyString(value))
            return [];
        return [
            {
                rule: 'okf-type-present',
                severity: 'error',
                file: ctx.file,
                pointer: '/type',
                message: '`type` is required and must be a non-empty string.',
            },
        ];
    },
};
//# sourceMappingURL=okfTypePresent.js.map