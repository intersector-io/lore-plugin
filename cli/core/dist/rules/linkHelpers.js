import { isNonEmptyString, readField } from './fieldHelpers.js';
/** The four typed-link edges under `x-lore.links` (CONTEXT.md "Typed Link"). */
export const LINK_TYPES = ['supersedes', 'implements', 'constrains', 'relates'];
/** Reads one `x-lore.links.<type>` list, tolerating a missing/malformed value (schema rules report those separately). */
export function readLinkTargets(frontmatter, type) {
    const value = readField(frontmatter, ['x-lore', 'links', type]);
    if (!Array.isArray(value))
        return [];
    return value.filter(isNonEmptyString);
}
/** Reads `x-lore.id`, tolerating a missing/malformed value. */
export function readRecordId(frontmatter) {
    const value = readField(frontmatter, ['x-lore', 'id']);
    return isNonEmptyString(value) ? value : undefined;
}
//# sourceMappingURL=linkHelpers.js.map