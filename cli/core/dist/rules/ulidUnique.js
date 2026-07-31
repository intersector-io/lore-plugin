import { isNonEmptyString, readField } from './fieldHelpers.js';
/**
 * `x-lore.id` must be unique across the repo (PRD.md §11.2): a duplicate is
 * an error on every file that shares it. The only rule in this family that
 * needs a repo-wide view rather than a single file (see rules/types.ts
 * RepoRule — the phase issue 0004 reuses for link integrity).
 */
export const ulidUnique = {
    name: 'record/ulid-unique',
    check(ctx) {
        const filesById = new Map();
        for (const { file, frontmatter } of ctx.files) {
            const id = readField(frontmatter, ['x-lore', 'id']);
            if (!isNonEmptyString(id))
                continue;
            const files = filesById.get(id) ?? [];
            files.push(file);
            filesById.set(id, files);
        }
        const diagnostics = [];
        for (const [id, files] of filesById) {
            if (files.length < 2)
                continue;
            for (const file of files) {
                const others = files.filter((f) => f !== file);
                diagnostics.push({
                    rule: 'record/ulid-unique',
                    severity: 'error',
                    file,
                    pointer: '/x-lore/id',
                    message: `\`x-lore.id\` "${id}" is not unique: also used by ${others.join(', ')}.`,
                });
            }
        }
        diagnostics.sort((a, b) => a.file.localeCompare(b.file));
        return diagnostics;
    },
};
//# sourceMappingURL=ulidUnique.js.map