import { isNonEmptyString, readField } from './fieldHelpers.js';
import { isWellFormedUlid } from './ulid.js';
/**
 * `x-lore.id` must be a well-formed ULID (PRD.md §7.1, §11.2). Presence is
 * gated by `lore-required-fields`; this rule only judges shape.
 */
export const ulidFormat = {
    name: 'record/ulid-format',
    check(ctx) {
        const value = readField(ctx.frontmatter.value, ['x-lore', 'id']);
        if (!isNonEmptyString(value))
            return [];
        if (isWellFormedUlid(value))
            return [];
        return [
            {
                rule: 'record/ulid-format',
                severity: 'error',
                file: ctx.file,
                pointer: '/x-lore/id',
                message: `\`x-lore.id\` must be a well-formed ULID (26-character Crockford base32): got "${value}".`,
            },
        ];
    },
};
//# sourceMappingURL=ulidFormat.js.map