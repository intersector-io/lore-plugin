import { type FrontmatterParseResult } from './frontmatter.js';
import { type RuleContext, type RepoRuleFileContext, type LoreConfigInput } from './rules/index.js';
import type { Diagnostic } from './types.js';
export interface RulePhaseOptions {
    /**
     * Rule names to leave out of this run. Used by candidate validation for the
     * rules that need a real placement in the repo tree to mean anything — a
     * candidate that hasn't been given a path yet can't meaningfully be checked
     * for where it sits, or for colliding with an id it doesn't occupy.
     */
    skipRules?: ReadonlySet<string>;
}
/**
 * Every per-record rule phase, in order, for one record — whether it came off
 * disk or arrived as a proposal.
 *
 * Two preconditions are encoded here rather than at the call sites:
 *
 * 1. Secret lint is a hard gate independent of frontmatter validity (PRD.md
 *    §13.9) — it must still catch a leaked key in a file whose frontmatter is
 *    broken, so it runs before the bail-out below.
 * 2. Everything after it assumes a successfully parsed frontmatter object.
 *    Running those rules against a missing/unparseable block would just pile
 *    "field is required" noise on top of the `frontmatter-parses` error, so a
 *    record that failed to parse stops here.
 */
export declare function runRecordRules(ctx: RuleContext, options?: RulePhaseOptions): Diagnostic[];
/**
 * The repo-level phase: rules needing a cross-file view (ULID uniqueness, type
 * resolution, link integrity, supersession atomicity). Runs once, after every
 * per-record pass, over the files whose frontmatter parsed.
 */
export declare function runRepoRules(files: RepoRuleFileContext[], allFiles: string[], options?: RulePhaseOptions): Diagnostic[];
/**
 * The Lore Config phase (issue 0005): `.lore/` schema + referential checks,
 * which need the raw `.lore/` file contents on top of every record's parsed
 * frontmatter. `.lore/` is optional (K0), so a repo with none of the three
 * files skips the phase entirely rather than reporting "missing config".
 *
 * Lives here, beside the other phases, because a candidate is subject to it
 * too (docs/issues/0083): `config/owner-unmapped` is the one config rule that
 * anchors on a *record*, and a candidate that skipped it validated clean
 * through `propose_record` only for `lore validate` to report the unmapped
 * owner once it was already canon.
 */
export declare function runConfigRules(config: LoreConfigInput, files: RepoRuleFileContext[], options?: RulePhaseOptions): Diagnostic[];
/**
 * A record's context for the repo-level phase, or `undefined` when its
 * frontmatter didn't parse — repo rules only ever see parseable records (the
 * parse failure is already reported against the file itself by
 * `frontmatter-parses`, and a record with no readable frontmatter has no id or
 * links to cross-reference).
 */
export declare function toRepoContext(file: string, raw: string, 
/** Pass an existing parse to avoid a second one — `validateFiles` already parsed this record to run its per-record rules. */
frontmatter?: FrontmatterParseResult): RepoRuleFileContext | undefined;
/** Reads one record off disk into the context every per-record rule takes. */
export declare function readRecordContext(rootDir: string, file: string): Promise<RuleContext>;
/**
 * Loads the repo-level contexts for `files` without diagnosing them — what
 * candidate validation needs to overlay a proposal on the live catalog and ask
 * repo-wide questions of the result.
 */
export declare function loadRepoContexts(rootDir: string, files: string[]): Promise<RepoRuleFileContext[]>;
//# sourceMappingURL=pipeline.d.ts.map