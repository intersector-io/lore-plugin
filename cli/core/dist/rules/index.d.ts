import type { Rule, RepoRule, ConfigRule } from './types.js';
export type { Rule, RuleContext, RepoRule, RepoRuleContext, RepoRuleFileContext, ConfigRule, ConfigRuleContext, LoreConfigInput, } from './types.js';
/**
 * Registry of all rule modules. Later issues (0002-0005) add rule families
 * by appending here — no existing rule module is touched.
 *
 * Rules after `frontmatterParses` assume frontmatter parsed successfully;
 * validate.ts only runs them when that precondition holds.
 */
export declare const FRONTMATTER_PRESENCE_RULES: Rule[];
export declare const SCHEMA_RULES: Rule[];
/**
 * Record rule family (docs/issues/0002-record-rules.md): identity, status,
 * description, the OKF 0.2 `generated`/`stale_after` families, placement,
 * and forbidden stored-derivable keys.
 * Per-file; runs under the same parsed-frontmatter precondition as
 * SCHEMA_RULES.
 */
export declare const RECORD_RULES: Rule[];
/**
 * Type-catalog rule family (docs/issues/0003-type-records-catalog.md):
 * the meta-schema (compiled in code) for Type Records themselves. Runs
 * per-file under the same parsed-frontmatter precondition as RECORD_RULES.
 */
export declare const TYPE_RULES: Rule[];
/**
 * Link rule family (docs/issues/0004-link-rules.md): typed-link integrity,
 * body-link references, and supersession atomicity all need a repo-wide
 * view (REPO_RULES below). Self-or-duplicate is a pure function of one
 * record's own frontmatter, so it runs per-file alongside RECORD_RULES.
 */
export declare const LINK_RULES: Rule[];
/**
 * Repo-level rules: need a cross-file view (e.g. ULID uniqueness, type
 * resolution). Run once per validation pass, after all per-file rules, over
 * every file whose frontmatter parsed successfully. Type resolution must
 * run before type field validation (the latter needs the former's notion of
 * "known type"), so order matters here.
 */
export declare const REPO_RULES: RepoRule[];
/**
 * Secret/PII lint (docs/issues/0005-secret-lint-config-sanity.md,
 * CONTEXT.md "Secret Lint"): a hard gate scanning raw file content
 * (frontmatter + body). Runs per-file alongside RECORD_RULES — it needs no
 * repo-wide view, only `ctx.raw`.
 */
export declare const SECRET_RULES: Rule[];
/**
 * Lore Config sanity (docs/issues/0005): `.lore/config.yml`,
 * `.lore/identities.yml`, `.lore/grants.yml` schema/referential checks.
 * Distinct phase from REPO_RULES because these rules need the raw `.lore/`
 * file contents, not just per-record frontmatter (see ConfigRuleContext).
 * validate.ts skips this phase entirely when `.lore/` doesn't exist at all
 * (config is optional in K0).
 */
export declare const CONFIG_RULES: ConfigRule[];
//# sourceMappingURL=index.d.ts.map