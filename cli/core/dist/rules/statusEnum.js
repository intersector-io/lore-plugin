import { isNonEmptyString, readField } from './fieldHelpers.js';
const VALID_STATUSES = new Set(['active', 'superseded', 'retired']);
// `draft`/`canonical` get a dedicated, ADR-0001-specific diagnostic from
// record/derived-field-stored — skip them here to avoid a redundant error.
const DERIVED_STATUS_VALUES = new Set(['draft', 'canonical']);
/**
 * `x-lore.status` records facts about the record itself, independent of
 * location, and is limited to `active | superseded | retired` (CONTEXT.md
 * "Status", ADR-0001).
 */
export const statusEnum = {
    name: 'record/status-enum',
    check(ctx) {
        const value = readField(ctx.frontmatter.value, ['x-lore', 'status']);
        if (!isNonEmptyString(value))
            return [];
        if (VALID_STATUSES.has(value))
            return [];
        if (DERIVED_STATUS_VALUES.has(value))
            return [];
        return [
            {
                rule: 'record/status-enum',
                severity: 'error',
                file: ctx.file,
                pointer: '/x-lore/status',
                message: `\`x-lore.status\` must be one of active, superseded, retired: got "${value}".`,
            },
        ];
    },
};
//# sourceMappingURL=statusEnum.js.map