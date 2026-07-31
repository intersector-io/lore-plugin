import type { Diagnostic } from '../types.js';
export declare function isWellFormedScope(value: unknown): value is string;
export declare const CONFIG_FILE = ".lore/config.yml";
export interface ParsedConfig {
    claim: 'preferred_username' | 'email';
    strictness: 'warn' | 'strict';
    errors: Diagnostic[];
}
/**
 * Parses `.lore/config.yml` (STS claim choice + identity-map strictness).
 * A missing file uses documented defaults (`preferred_username` / `warn`),
 * never an error — the file is optional (issue 0005 acceptance criteria).
 */
export declare function parseConfigYml(raw: string | undefined): ParsedConfig;
export declare const IDENTITIES_FILE = ".lore/identities.yml";
export interface ParsedIdentities {
    /** Corporate identity values (git-host handle -> identity map's RHS). */
    values: Set<string>;
    errors: Diagnostic[];
}
/**
 * Parses `.lore/identities.yml` (git-host handle -> corporate identity).
 * An absent or comment-only file (parses to `null`/`undefined`) is an empty
 * map, not an error — identities are opt-in as handles are added.
 */
export declare function parseIdentitiesYml(raw: string | undefined): ParsedIdentities;
export declare const GRANTS_FILE = ".lore/grants.yml";
export interface GrantEntry {
    from: string;
    to: string;
    index: number;
}
export interface ParsedGrants {
    entries: GrantEntry[];
    /** Basic-schema errors (bad YAML, missing `grants` list, non-object entries, missing/non-string from/to). */
    errors: Diagnostic[];
}
/**
 * Parses `.lore/grants.yml` (scope->scope namespace grants, PRD.md §8.8
 * R35): a top-level `grants:` list of `{ from, to }` entries, matching the
 * shape already shipped in template/.lore/grants.yml. Scope well-formedness
 * of `from`/`to` is deliberately NOT checked here — that's
 * `config/grant-scope`'s job, so a malformed-YAML fixture and a
 * malformed-scope fixture report under distinct rule ids.
 */
export declare function parseGrantsYml(raw: string | undefined): ParsedGrants;
//# sourceMappingURL=loreConfigParse.d.ts.map