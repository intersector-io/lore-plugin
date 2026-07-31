import { readField } from './fieldHelpers.js';
import { readLinkTargets, readRecordId } from './linkHelpers.js';
/**
 * Supersession atomicity (docs/issues/0004-link-rules.md, CONTEXT.md
 * "Supersession", the Main Invariant edge): if record A `supersedes` B, then
 * B's `x-lore.status` must be `superseded` in the same tree; and every
 * record with `status: superseded` must be the target of at least one
 * `supersedes` link. Both directions are errors. Targets that don't resolve
 * to a known record at all are left to `links/typed-integrity` — this rule
 * only judges records it can actually find.
 */
export const supersessionAtomicity = {
    name: 'links/supersession-atomicity',
    check(ctx) {
        const byId = new Map();
        for (const f of ctx.files) {
            const id = readRecordId(f.frontmatter);
            if (id)
                byId.set(id, f);
        }
        const diagnostics = [];
        const supersededTargetIds = new Set();
        for (const f of ctx.files) {
            const targets = readLinkTargets(f.frontmatter, 'supersedes');
            targets.forEach((targetId, index) => {
                const target = byId.get(targetId);
                if (!target)
                    return; // unresolved target: links/typed-integrity already reports this
                supersededTargetIds.add(targetId);
                const targetStatus = readField(target.frontmatter, ['x-lore', 'status']);
                if (targetStatus === 'superseded')
                    return;
                diagnostics.push({
                    rule: 'links/supersession-atomicity',
                    severity: 'error',
                    file: f.file,
                    pointer: `/x-lore/links/supersedes/${index}`,
                    message: `\`x-lore.links.supersedes\` target "${targetId}" (${target.file}) must have \`x-lore.status: superseded\`, but has status "${String(targetStatus)}".`,
                });
            });
        }
        for (const f of ctx.files) {
            const status = readField(f.frontmatter, ['x-lore', 'status']);
            if (status !== 'superseded')
                continue;
            const id = readRecordId(f.frontmatter);
            if (id && supersededTargetIds.has(id))
                continue;
            diagnostics.push({
                rule: 'links/supersession-atomicity',
                severity: 'error',
                file: f.file,
                pointer: '/x-lore/status',
                // The orphan's own id is deliberately part of the message: changed-mode
                // validation retains a repo-rule diagnostic on an UNCHANGED file only
                // when its message names a touched id/path (validate.ts), and deleting
                // the superseding record is exactly the change that orphans this one.
                message: `\`x-lore.status: superseded\` requires this record${id ? ` ("${id}")` : ''} to be the target of at least one \`supersedes\` link, but none was found.`,
            });
        }
        diagnostics.sort((a, b) => a.file.localeCompare(b.file) || a.pointer.localeCompare(b.pointer));
        return diagnostics;
    },
};
//# sourceMappingURL=supersessionAtomicity.js.map