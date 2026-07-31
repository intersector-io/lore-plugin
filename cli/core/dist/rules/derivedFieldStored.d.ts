import type { Rule } from './types.js';
/**
 * Forbidden stored-derivable keys (ADR-0001): `scope`, `slug`, `created`,
 * `updated` must never appear in frontmatter, and `x-lore.status` must
 * never carry the old `draft`/`canonical` values (superseded by branch
 * placement).
 */
export declare const derivedFieldStored: Rule;
//# sourceMappingURL=derivedFieldStored.d.ts.map