import { isNonEmptyString, readField } from './fieldHelpers.js';
/**
 * Path placement (PRD.md §7.1): records live under `/org/{type}/…`,
 * `/products/<slug>/{type}/…`, or `/teams/<slug>/{type}/…`. The `{type}`
 * directory segment must equal the frontmatter `type` slug — scope itself
 * is derived from the root (org/products/teams) and is never checked
 * against frontmatter, because frontmatter must never carry it (ADR-0001;
 * see record/derived-field-stored).
 */
export const placement = {
    name: 'record/placement',
    check(ctx) {
        const typeValue = readField(ctx.frontmatter.value, ['type']);
        const segments = ctx.file.split('/');
        const root = segments[0];
        let typeSegment;
        if (root === 'org') {
            typeSegment = segments[1];
        }
        else if (root === 'products' || root === 'teams') {
            typeSegment = segments[2];
        }
        if (!typeSegment) {
            return [
                {
                    rule: 'record/placement',
                    severity: 'error',
                    file: ctx.file,
                    pointer: '/type',
                    message: 'Record path does not match the expected layout (/org/{type}/…, /products/<slug>/{type}/…, /teams/<slug>/{type}/…).',
                },
            ];
        }
        if (isNonEmptyString(typeValue) && typeValue !== typeSegment) {
            return [
                {
                    rule: 'record/placement',
                    severity: 'error',
                    file: ctx.file,
                    pointer: '/type',
                    message: `Path type directory "${typeSegment}" must match frontmatter \`type: ${typeValue}\`.`,
                },
            ];
        }
        return [];
    },
};
//# sourceMappingURL=placement.js.map