import { isNonEmptyString, readField } from './fieldHelpers.js';
import { readRecordId } from './linkHelpers.js';
import { C4_ELEMENT_TYPES, C4_REFERENCES, isC4ElementType } from './c4Helpers.js';
function indexByIdType(files) {
    const typeById = new Map();
    for (const f of files) {
        const id = readRecordId(f.frontmatter);
        if (id)
            typeById.set(id, readField(f.frontmatter, ['type']));
    }
    return typeById;
}
export const c4Reference = {
    name: 'c4/reference',
    check(ctx) {
        const typeById = indexByIdType(ctx.files);
        const diagnostics = [];
        for (const f of ctx.files) {
            const type = readField(f.frontmatter, ['type']);
            if (typeof type !== 'string' || !(type in C4_REFERENCES))
                continue;
            for (const { field, requiredType } of C4_REFERENCES[type]) {
                const target = readField(f.frontmatter, ['x-type', field]);
                if (!isNonEmptyString(target))
                    continue; // shape is the schema rule's job
                if (!typeById.has(target)) {
                    diagnostics.push({
                        rule: 'c4/reference',
                        severity: 'error',
                        file: f.file,
                        pointer: `/x-type/${field}`,
                        message: `\`x-type.${field}\` target "${target}" does not exist as a record id in this repo.`,
                    });
                    continue;
                }
                const targetType = typeById.get(target);
                const okType = requiredType ? targetType === requiredType : isC4ElementType(targetType);
                if (!okType) {
                    const expected = requiredType ?? `a C4 element (${C4_ELEMENT_TYPES.join(', ')})`;
                    diagnostics.push({
                        rule: 'c4/reference',
                        severity: 'error',
                        file: f.file,
                        pointer: `/x-type/${field}`,
                        message: `\`x-type.${field}\` target "${target}" must be ${expected}, but it is ${String(targetType)}.`,
                    });
                }
            }
        }
        diagnostics.sort((a, b) => a.file.localeCompare(b.file) || a.pointer.localeCompare(b.pointer));
        return diagnostics;
    },
};
//# sourceMappingURL=c4Reference.js.map