import type { RepoRule } from './types.js';
/**
 * Supersession atomicity (docs/issues/0004-link-rules.md, CONTEXT.md
 * "Supersession", the Main Invariant edge): if record A `supersedes` B, then
 * B's `x-lore.status` must be `superseded` in the same tree; and every
 * record with `status: superseded` must be the target of at least one
 * `supersedes` link. Both directions are errors. Targets that don't resolve
 * to a known record at all are left to `links/typed-integrity` — this rule
 * only judges records it can actually find.
 */
export declare const supersessionAtomicity: RepoRule;
//# sourceMappingURL=supersessionAtomicity.d.ts.map