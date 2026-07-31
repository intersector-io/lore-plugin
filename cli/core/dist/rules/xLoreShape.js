import { readField } from './fieldHelpers.js';
/**
 * The complete, closed set of `x-lore` members. Everything the block may
 * carry: identity (`id`/`status`), ownership (`owners`), the typed-link
 * vocabulary (`links`), and origin (`provenance`) — the exact shape
 * `scaffoldRecord` writes.
 */
const KNOWN_X_LORE_MEMBERS = ['id', 'status', 'owners', 'links', 'provenance'];
const KNOWN_SET = new Set(KNOWN_X_LORE_MEMBERS);
/**
 * Closed `x-lore` shape (docs/issues/0095): the `x-lore` block accepts only
 * its known members. Nothing else validates the block's key set, so an
 * unknown member (`depends_on`, `superseded_by`, …) sailed through and landed
 * permanently in canon — and `propose_revision` can never remove it (`links`
 * is the only member it may replace). Closing the shape here rejects the
 * unknown member at authoring time, before it becomes canon.
 */
export const xLoreShape = {
    name: 'record/x-lore-shape',
    check(ctx) {
        const xLore = readField(ctx.frontmatter.value, ['x-lore']);
        if (typeof xLore !== 'object' || xLore === null || Array.isArray(xLore))
            return [];
        return Object.keys(xLore)
            .filter((key) => !KNOWN_SET.has(key))
            .map((key) => ({
            rule: 'record/x-lore-shape',
            severity: 'error',
            file: ctx.file,
            pointer: `/x-lore/${key}`,
            message: `\`x-lore.${key}\` is not a known \`x-lore\` member. Allowed members: ${KNOWN_X_LORE_MEMBERS.join(', ')}. Relationships between records go in \`x-lore.links\` (implements / constrains / relates / supersedes).`,
        }));
    },
};
//# sourceMappingURL=xLoreShape.js.map