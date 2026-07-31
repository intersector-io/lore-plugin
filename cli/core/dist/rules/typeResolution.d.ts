import type { RepoRule, RepoRuleFileContext } from './types.js';
/** Slug of every Type Record (`type: type`) present in this validation pass, keyed by filename slug. */
export declare function typeRecordsBySlug(files: RepoRuleFileContext[]): Map<string, RepoRuleFileContext>;
/**
 * Type resolution (docs/issues/0003-type-records-catalog.md): every record's
 * `type` slug must resolve to a Type Record at `org/type/<type>.md` in the
 * same repo. Unknown slug is an error — `type/unknown`.
 */
export declare const typeResolution: RepoRule;
//# sourceMappingURL=typeResolution.d.ts.map