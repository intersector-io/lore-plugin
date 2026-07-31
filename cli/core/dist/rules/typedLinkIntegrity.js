import { LINK_TYPES, readLinkTargets, readRecordId } from './linkHelpers.js';
/**
 * Typed-link integrity (docs/issues/0004-link-rules.md, CONTEXT.md "Typed
 * Link"): every ULID referenced by `x-lore.links.{supersedes,implements,
 * constrains,relates}` must exist as another record's `x-lore.id` in this
 * repo — error otherwise. CI-enforced, unlike the lenient body-link
 * `references` edge (`links/reference`).
 */
export const typedLinkIntegrity = {
    name: 'links/typed-integrity',
    check(ctx) {
        const knownIds = new Set();
        for (const f of ctx.files) {
            const id = readRecordId(f.frontmatter);
            if (id)
                knownIds.add(id);
        }
        const diagnostics = [];
        for (const f of ctx.files) {
            for (const type of LINK_TYPES) {
                const targets = readLinkTargets(f.frontmatter, type);
                targets.forEach((target, index) => {
                    if (knownIds.has(target))
                        return;
                    diagnostics.push({
                        rule: 'links/typed-integrity',
                        severity: 'error',
                        file: f.file,
                        pointer: `/x-lore/links/${type}/${index}`,
                        message: `\`x-lore.links.${type}\` target "${target}" does not exist as a record id in this repo.`,
                    });
                });
            }
        }
        diagnostics.sort((a, b) => a.file.localeCompare(b.file) || a.pointer.localeCompare(b.pointer));
        return diagnostics;
    },
};
//# sourceMappingURL=typedLinkIntegrity.js.map