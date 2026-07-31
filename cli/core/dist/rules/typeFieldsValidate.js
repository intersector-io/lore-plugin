import { isNonEmptyString, readField } from './fieldHelpers.js';
import { typeRecordsBySlug } from './typeResolution.js';
import { validateAgainstSchema } from '../jsonSchema.js';
/**
 * Per-type field validation (docs/issues/0003-type-records-catalog.md):
 * required body sections and the `x-type` JSON Schema, both sourced from
 * the resolved Type Record. Skips records whose type doesn't resolve
 * (type/unknown already reports that) and skips Type Records themselves —
 * those validate against the compiled meta-schema (type/meta-schema), never
 * against `org/type/type.md` content (ADR-0002).
 */
export const typeFieldsValidate = {
    name: 'type/fields',
    check(ctx) {
        const typeRecords = typeRecordsBySlug(ctx.files);
        const diagnostics = [];
        for (const f of ctx.files) {
            const typeValue = readField(f.frontmatter, ['type']);
            if (!isNonEmptyString(typeValue))
                continue;
            if (typeValue === 'type')
                continue;
            const typeRecord = typeRecords.get(typeValue);
            if (!typeRecord)
                continue;
            const xLoreType = readField(typeRecord.frontmatter, ['x-lore-type']);
            if (!xLoreType || typeof xLoreType !== 'object')
                continue;
            const requiredSections = Array.isArray(xLoreType['required-sections'])
                ? xLoreType['required-sections'].filter(isNonEmptyString)
                : [];
            for (const heading of requiredSections) {
                if (!hasHeading(f.raw, heading)) {
                    diagnostics.push({
                        rule: 'type/missing-section',
                        severity: 'error',
                        file: f.file,
                        pointer: '/body',
                        message: `Record of type "${typeValue}" is missing required section "## ${heading}".`,
                    });
                }
            }
            if (xLoreType.schema) {
                const xType = readField(f.frontmatter, ['x-type']);
                const violations = validateAgainstSchema(xLoreType.schema, xType ?? {}, '/x-type');
                for (const violation of violations) {
                    diagnostics.push({
                        rule: 'type/x-type-schema',
                        severity: 'error',
                        file: f.file,
                        pointer: violation.pointer,
                        message: violation.message,
                    });
                }
            }
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
//# sourceMappingURL=typeFieldsValidate.js.map