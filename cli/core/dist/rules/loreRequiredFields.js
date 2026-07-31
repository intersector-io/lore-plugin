import { isNonEmptyString, readField } from './fieldHelpers.js';
// Field path (JSON-pointer-ish) paired with the frontmatter lookup path.
const REQUIRED_FIELDS = [
    { pointer: '/title', path: ['title'] },
    { pointer: '/description', path: ['description'] },
    { pointer: '/x-lore/id', path: ['x-lore', 'id'] },
    { pointer: '/x-lore/status', path: ['x-lore', 'status'] },
];
/**
 * Lore-required fields on top of the OKF baseline (PRD.md §7.1, §11.7):
 * `title`, `description`, and the `x-lore.id` / `x-lore.status` identity
 * fields must all be present and non-empty.
 */
export const loreRequiredFields = {
    name: 'lore-required-fields',
    check(ctx) {
        const diagnostics = [];
        for (const { pointer, path } of REQUIRED_FIELDS) {
            const value = readField(ctx.frontmatter.value, path);
            if (isNonEmptyString(value))
                continue;
            diagnostics.push({
                rule: 'lore-required-fields',
                severity: 'error',
                file: ctx.file,
                pointer,
                message: `\`${path.join('.')}\` is required and must be a non-empty string.`,
            });
        }
        return diagnostics;
    },
};
//# sourceMappingURL=loreRequiredFields.js.map