import { LINK_TYPES, readLinkTargets, readRecordId } from './linkHelpers.js';
/**
 * Self-or-duplicate link (docs/issues/0004-link-rules.md): a link list must
 * not reference the record's own id, and must not list the same target
 * twice. Purely a function of one record's own frontmatter, so — unlike the
 * rest of the link family — this runs as a per-file rule, not a repo rule.
 */
export const selfOrDuplicateLink = {
    name: 'links/self-or-duplicate',
    check(ctx) {
        const ownId = readRecordId(ctx.frontmatter.value);
        const diagnostics = [];
        for (const type of LINK_TYPES) {
            const targets = readLinkTargets(ctx.frontmatter.value, type);
            const seenAt = new Map();
            targets.forEach((target, index) => {
                const pointer = `/x-lore/links/${type}/${index}`;
                if (ownId && target === ownId) {
                    diagnostics.push({
                        rule: 'links/self-or-duplicate',
                        severity: 'error',
                        file: ctx.file,
                        pointer,
                        message: `\`x-lore.links.${type}\` must not reference the record's own id ("${target}").`,
                    });
                }
                const firstIndex = seenAt.get(target);
                if (firstIndex === undefined) {
                    seenAt.set(target, index);
                }
                else {
                    diagnostics.push({
                        rule: 'links/self-or-duplicate',
                        severity: 'error',
                        file: ctx.file,
                        pointer,
                        message: `\`x-lore.links.${type}\` contains duplicate target "${target}" (already listed at index ${firstIndex}).`,
                    });
                }
            });
        }
        return diagnostics;
    },
};
//# sourceMappingURL=selfOrDuplicateLink.js.map