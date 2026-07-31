import { isNonEmptyString, readField } from './fieldHelpers.js';
// Body sections every Type Record must carry (docs/adr/0002, issue 0003).
// Compiled in code — never read from `org/type/type.md` content, so a
// malformed Type Record is caught even when the descriptive `type` Type
// Record itself says nothing about it.
const REQUIRED_BODY_SECTIONS = ['Template', 'Worked Example', 'Reviewer Checklist'];
/**
 * Meta-schema: the shape of a Type Record (`type: type`), compiled into the
 * validation core rather than self-hosted (ADR-0002). Checks the
 * `x-lore-type` frontmatter block and the body's required sections,
 * including a fenced ```markdown template under "## Template".
 */
export const typeMetaSchema = {
    name: 'type/meta-schema',
    check(ctx) {
        const typeValue = readField(ctx.frontmatter.value, ['type']);
        if (typeValue !== 'type')
            return [];
        const diagnostics = [];
        const xLoreType = readField(ctx.frontmatter.value, ['x-lore-type']);
        if (typeof xLoreType !== 'object' || xLoreType === null || Array.isArray(xLoreType)) {
            diagnostics.push(error(ctx.file, '/x-lore-type', '`x-lore-type` is required on a Type Record and must be an object.'));
        }
        else {
            const block = xLoreType;
            if (block.schema !== undefined) {
                if (typeof block.schema !== 'object' || block.schema === null || Array.isArray(block.schema)) {
                    diagnostics.push(error(ctx.file, '/x-lore-type/schema', '`x-lore-type.schema`, if present, must be a JSON Schema object.'));
                }
            }
            const requiredSections = block['required-sections'];
            if (!Array.isArray(requiredSections) || !requiredSections.every((s) => isNonEmptyString(s))) {
                diagnostics.push(error(ctx.file, '/x-lore-type/required-sections', '`x-lore-type.required-sections` is required and must be an array of non-empty strings.'));
            }
            const classificationTest = block['classification-test'];
            if (!isNonEmptyString(classificationTest)) {
                diagnostics.push(error(ctx.file, '/x-lore-type/classification-test', '`x-lore-type.classification-test` is required and must be a non-empty string.'));
            }
        }
        for (const heading of REQUIRED_BODY_SECTIONS) {
            if (!hasHeading(ctx.raw, heading)) {
                diagnostics.push(error(ctx.file, '/body', `Type Record body is missing required section "## ${heading}".`));
            }
        }
        if (!/```markdown[\s\S]*?```/.test(ctx.raw)) {
            diagnostics.push(error(ctx.file, '/body', 'Type Record body must contain a fenced ```markdown authoring template under "## Template".'));
        }
        return diagnostics;
    },
};
function hasHeading(raw, heading) {
    const pattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, 'm');
    return pattern.test(raw);
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function error(file, pointer, message) {
    return { rule: 'type/meta-schema', severity: 'error', file, pointer, message };
}
//# sourceMappingURL=typeMetaSchema.js.map