import type { Rule } from './types.js';
/**
 * Frontmatter must be present and parse as YAML. This is the load-bearing
 * rule every other rule depends on: if it fails, later rules simply have
 * nothing to check (see validate.ts, which skips them in that case).
 */
export declare const frontmatterParses: Rule;
//# sourceMappingURL=frontmatterParses.d.ts.map