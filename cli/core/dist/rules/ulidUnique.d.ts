import type { RepoRule } from './types.js';
/**
 * `x-lore.id` must be unique across the repo (PRD.md §11.2): a duplicate is
 * an error on every file that shares it. The only rule in this family that
 * needs a repo-wide view rather than a single file (see rules/types.ts
 * RepoRule — the phase issue 0004 reuses for link integrity).
 */
export declare const ulidUnique: RepoRule;
//# sourceMappingURL=ulidUnique.d.ts.map