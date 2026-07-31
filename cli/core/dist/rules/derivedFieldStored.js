import { isNonEmptyString, readField } from './fieldHelpers.js';
// Facts git already carries; storing them duplicates a fact and guarantees
// a moment of inconsistency (ADR-0001: derive, don't store).
const FORBIDDEN_TOP_LEVEL_KEYS = ['scope', 'slug', 'created', 'updated'];
const DERIVED_STATUS_VALUES = new Set(['draft', 'canonical']);
/**
 * Forbidden stored-derivable keys (ADR-0001): `scope`, `slug`, `created`,
 * `updated` must never appear in frontmatter, and `x-lore.status` must
 * never carry the old `draft`/`canonical` values (superseded by branch
 * placement).
 */
export const derivedFieldStored = {
    name: 'record/derived-field-stored',
    check(ctx) {
        const diagnostics = [];
        const root = ctx.frontmatter.value;
        if (typeof root === 'object' && root !== null && !Array.isArray(root)) {
            for (const key of FORBIDDEN_TOP_LEVEL_KEYS) {
                if (Object.prototype.hasOwnProperty.call(root, key)) {
                    diagnostics.push({
                        rule: 'record/derived-field-stored',
                        severity: 'error',
                        file: ctx.file,
                        pointer: `/${key}`,
                        message: `\`${key}\` must not be stored in frontmatter — it is derived, never stored (see ADR-0001).`,
                    });
                }
            }
        }
        const statusValue = readField(ctx.frontmatter.value, ['x-lore', 'status']);
        if (isNonEmptyString(statusValue) && DERIVED_STATUS_VALUES.has(statusValue)) {
            diagnostics.push({
                rule: 'record/derived-field-stored',
                severity: 'error',
                file: ctx.file,
                pointer: '/x-lore/status',
                message: `\`x-lore.status\` value "${statusValue}" is derived from branch placement, not stored in frontmatter (see ADR-0001).`,
            });
        }
        return diagnostics;
    },
};
//# sourceMappingURL=derivedFieldStored.js.map