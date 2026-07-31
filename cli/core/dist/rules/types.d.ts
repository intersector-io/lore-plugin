import type { Diagnostic } from '../types.js';
import type { FrontmatterParseResult } from '../frontmatter.js';
/**
 * Context handed to every rule for a single record file. Rules are pure
 * functions of this context — no filesystem access, no shared state — so
 * later issues (0002-0005) can add rule families without touching existing
 * ones (ADR-0002: one shared validation core, no rule-to-rule coupling).
 */
export interface RuleContext {
    /** Path relative to the validated repo root, forward-slashed. */
    file: string;
    /** Raw file content. */
    raw: string;
    /** Result of parsing the file's YAML frontmatter block. */
    frontmatter: FrontmatterParseResult;
}
export interface Rule {
    name: string;
    check(ctx: RuleContext): Diagnostic[];
}
/**
 * Per-file input to a repo-level rule: the file's path and its already
 * successfully-parsed frontmatter value. Files whose frontmatter failed to
 * parse are excluded upstream (validate.ts) — repo rules never see them.
 */
export interface RepoRuleFileContext {
    file: string;
    frontmatter: unknown;
    /** Raw file content, needed by rules that check body sections (e.g. type/missing-section). */
    raw: string;
}
/**
 * Context handed to rules that need a cross-file, repo-wide view (e.g. ULID
 * uniqueness). Kept intentionally small so issue 0004 (link integrity) can
 * reuse the same phase without a new interface.
 */
export interface RepoRuleContext {
    files: RepoRuleFileContext[];
    /**
     * Every file path considered in this validation pass, including ones whose
     * frontmatter failed to parse or is missing. `links/reference` (issue
     * 0004) needs this: a body link can point at a file that exists on disk
     * even when that file's own frontmatter is broken — that's a distinct
     * failure `frontmatter-parses` already reports on the target file, not a
     * broken reference on the source file.
     */
    allFiles: string[];
}
export interface RepoRule {
    name: string;
    check(ctx: RepoRuleContext): Diagnostic[];
}
/**
 * Raw content of the three optional `.lore/` configuration files (issue
 * 0005, CONTEXT.md "Lore Config"), read once by validate.ts. `undefined`
 * means the file does not exist — every config rule treats a missing file
 * as "use defaults / empty," never as a parse error. Whether `.lore/`
 * exists at all (all three undefined) is decided by the caller, which skips
 * the whole config rule phase in that case (config is optional in K0).
 */
export interface LoreConfigInput {
    configRaw?: string;
    identitiesRaw?: string;
    grantsRaw?: string;
}
/**
 * Context handed to the `config/*` rule family: the raw `.lore/` file
 * contents plus every record's parsed frontmatter (needed by
 * `config/owner-unmapped` to cross-reference `x-lore.owners`).
 */
export interface ConfigRuleContext extends LoreConfigInput {
    files: RepoRuleFileContext[];
}
export interface ConfigRule {
    name: string;
    check(ctx: ConfigRuleContext): Diagnostic[];
}
//# sourceMappingURL=types.d.ts.map