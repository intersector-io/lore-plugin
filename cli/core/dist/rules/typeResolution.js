import { isNonEmptyString, readField } from './fieldHelpers.js';
const TYPE_RECORD_PATH = /^org\/type\/([^/]+)\.md$/;
/** Slug of every Type Record (`type: type`) present in this validation pass, keyed by filename slug. */
export function typeRecordsBySlug(files) {
    const bySlug = new Map();
    for (const f of files) {
        const match = TYPE_RECORD_PATH.exec(f.file);
        if (!match)
            continue;
        if (readField(f.frontmatter, ['type']) !== 'type')
            continue;
        bySlug.set(match[1], f);
    }
    return bySlug;
}
/**
 * Type resolution (docs/issues/0003-type-records-catalog.md): every record's
 * `type` slug must resolve to a Type Record at `org/type/<type>.md` in the
 * same repo. Unknown slug is an error — `type/unknown`.
 */
export const typeResolution = {
    name: 'type/resolution',
    check(ctx) {
        const typeRecords = typeRecordsBySlug(ctx.files);
        const diagnostics = [];
        for (const f of ctx.files) {
            const typeValue = readField(f.frontmatter, ['type']);
            if (!isNonEmptyString(typeValue))
                continue;
            if (typeRecords.has(typeValue))
                continue;
            diagnostics.push({
                rule: 'type/unknown',
                severity: 'error',
                file: f.file,
                pointer: '/type',
                message: `\`type: ${typeValue}\` does not resolve to a Type Record at "org/type/${typeValue}.md".`,
            });
        }
        return diagnostics;
    },
};
//# sourceMappingURL=typeResolution.js.map