import type { Rule } from './types.js';
/**
 * Top-level `stale_after` (OKF 0.2 lifecycle family): an author-declared
 * expiry date — the record is stale once `today >= stale_after`. The one
 * OKF 0.2 field that stores a genuinely non-derivable fact (issue 0101), so
 * ADR-0001 welcomes it. Absolute `YYYY-MM-DD` only, per the spec — a plain
 * date comparison, no TTL arithmetic. Optional; absence is not an error.
 */
export declare const staleAfterFormat: Rule;
//# sourceMappingURL=staleAfterFormat.d.ts.map