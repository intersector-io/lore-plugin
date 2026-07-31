import type { Rule } from './types.js';
/**
 * Path placement (PRD.md §7.1): records live under `/org/{type}/…`,
 * `/products/<slug>/{type}/…`, or `/teams/<slug>/{type}/…`. The `{type}`
 * directory segment must equal the frontmatter `type` slug — scope itself
 * is derived from the root (org/products/teams) and is never checked
 * against frontmatter, because frontmatter must never carry it (ADR-0001;
 * see record/derived-field-stored).
 */
export declare const placement: Rule;
//# sourceMappingURL=placement.d.ts.map