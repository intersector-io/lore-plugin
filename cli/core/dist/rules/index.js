import { frontmatterParses } from './frontmatterParses.js';
import { okfTypePresent } from './okfTypePresent.js';
import { loreRequiredFields } from './loreRequiredFields.js';
import { ulidFormat } from './ulidFormat.js';
import { statusEnum } from './statusEnum.js';
import { descriptionRequired } from './descriptionRequired.js';
import { generatedFormat } from './generatedFormat.js';
import { staleAfterFormat } from './staleAfterFormat.js';
import { placement } from './placement.js';
import { derivedFieldStored } from './derivedFieldStored.js';
import { xLoreShape } from './xLoreShape.js';
import { ulidUnique } from './ulidUnique.js';
import { pathUnique } from './pathUnique.js';
import { typeMetaSchema } from './typeMetaSchema.js';
import { typeResolution } from './typeResolution.js';
import { typeFieldsValidate } from './typeFieldsValidate.js';
import { selfOrDuplicateLink } from './selfOrDuplicateLink.js';
import { typedLinkIntegrity } from './typedLinkIntegrity.js';
import { c4Reference } from './c4Reference.js';
import { reference } from './reference.js';
import { supersessionAtomicity } from './supersessionAtomicity.js';
import { secretLint } from './secretLint.js';
import { configParse } from './configParse.js';
import { grantScope } from './grantScope.js';
import { grantSelf, grantDuplicate } from './grantsIntegrity.js';
import { ownerUnmapped } from './ownerUnmapped.js';
/**
 * Registry of all rule modules. Later issues (0002-0005) add rule families
 * by appending here — no existing rule module is touched.
 *
 * Rules after `frontmatterParses` assume frontmatter parsed successfully;
 * validate.ts only runs them when that precondition holds.
 */
export const FRONTMATTER_PRESENCE_RULES = [frontmatterParses];
export const SCHEMA_RULES = [okfTypePresent, loreRequiredFields];
/**
 * Record rule family (docs/issues/0002-record-rules.md): identity, status,
 * description, the OKF 0.2 `generated`/`stale_after` families, placement,
 * and forbidden stored-derivable keys.
 * Per-file; runs under the same parsed-frontmatter precondition as
 * SCHEMA_RULES.
 */
export const RECORD_RULES = [
    ulidFormat,
    statusEnum,
    descriptionRequired,
    generatedFormat,
    staleAfterFormat,
    placement,
    derivedFieldStored,
    xLoreShape,
];
/**
 * Type-catalog rule family (docs/issues/0003-type-records-catalog.md):
 * the meta-schema (compiled in code) for Type Records themselves. Runs
 * per-file under the same parsed-frontmatter precondition as RECORD_RULES.
 */
export const TYPE_RULES = [typeMetaSchema];
/**
 * Link rule family (docs/issues/0004-link-rules.md): typed-link integrity,
 * body-link references, and supersession atomicity all need a repo-wide
 * view (REPO_RULES below). Self-or-duplicate is a pure function of one
 * record's own frontmatter, so it runs per-file alongside RECORD_RULES.
 */
export const LINK_RULES = [selfOrDuplicateLink];
/**
 * Repo-level rules: need a cross-file view (e.g. ULID uniqueness, type
 * resolution). Run once per validation pass, after all per-file rules, over
 * every file whose frontmatter parsed successfully. Type resolution must
 * run before type field validation (the latter needs the former's notion of
 * "known type"), so order matters here.
 */
export const REPO_RULES = [
    ulidUnique,
    pathUnique,
    typeResolution,
    typeFieldsValidate,
    typedLinkIntegrity,
    c4Reference,
    reference,
    supersessionAtomicity,
];
/**
 * Secret/PII lint (docs/issues/0005-secret-lint-config-sanity.md,
 * CONTEXT.md "Secret Lint"): a hard gate scanning raw file content
 * (frontmatter + body). Runs per-file alongside RECORD_RULES — it needs no
 * repo-wide view, only `ctx.raw`.
 */
export const SECRET_RULES = [secretLint];
/**
 * Lore Config sanity (docs/issues/0005): `.lore/config.yml`,
 * `.lore/identities.yml`, `.lore/grants.yml` schema/referential checks.
 * Distinct phase from REPO_RULES because these rules need the raw `.lore/`
 * file contents, not just per-record frontmatter (see ConfigRuleContext).
 * validate.ts skips this phase entirely when `.lore/` doesn't exist at all
 * (config is optional in K0).
 */
export const CONFIG_RULES = [configParse, grantScope, grantSelf, grantDuplicate, ownerUnmapped];
//# sourceMappingURL=index.js.map