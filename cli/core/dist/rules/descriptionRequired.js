import { isNonEmptyString, readField } from './fieldHelpers.js';
/**
 * `description` (PRD.md §7.1, CONTEXT.md "Description"): non-empty is the
 * gate, already enforced by `lore-required-fields`. This rule adds the
 * "single sentence" heuristic on top, as a warning at most (issue 0002).
 */
export const descriptionRequired = {
    name: 'record/description-required',
    check(ctx) {
        const value = readField(ctx.frontmatter.value, ['description']);
        if (!isNonEmptyString(value))
            return [];
        const trimmed = value.trim();
        if (/\r?\n/.test(trimmed)) {
            return [warn(ctx.file, '`description` should be a single line, not multi-line.')];
        }
        if (looksLikeMultipleSentences(trimmed)) {
            return [
                warn(ctx.file, '`description` looks like more than one sentence; keep it to a single summary sentence.'),
            ];
        }
        return [];
    },
};
function looksLikeMultipleSentences(text) {
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter((s) => s.trim().length > 0);
    return sentences.length > 1;
}
function warn(file, message) {
    return { rule: 'record/description-required', severity: 'warning', file, pointer: '/description', message };
}
//# sourceMappingURL=descriptionRequired.js.map