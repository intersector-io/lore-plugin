import type { Rule } from './types.js';
/**
 * Self-or-duplicate link (docs/issues/0004-link-rules.md): a link list must
 * not reference the record's own id, and must not list the same target
 * twice. Purely a function of one record's own frontmatter, so — unlike the
 * rest of the link family — this runs as a per-file rule, not a repo rule.
 */
export declare const selfOrDuplicateLink: Rule;
//# sourceMappingURL=selfOrDuplicateLink.d.ts.map