import type { Diagnostic, ValidationResult } from './types.js';
/**
 * Thrown by `initRepo` when its own self-validation postcondition fails
 * (docs/issues/0111): every input is refused loudly and individually via
 * `ScaffoldError` *before* anything is written, so reaching this point means
 * the generator itself produced an invalid tree — a defect in `initRepo`,
 * not in the caller's flags. Carries every diagnostic (not just one) so the
 * failure is fully diagnosable; nothing is left behind at `targetDir` either
 * way (the staged tree is discarded, never moved).
 */
export declare class InitPostconditionError extends Error {
    readonly diagnostics: Diagnostic[];
    constructor(diagnostics: Diagnostic[]);
}
export interface InitIdentity {
    /** git-host handle, e.g. a GitHub username. */
    handle: string;
    /** Corporate identity (the STS claim value) that handle resolves to. */
    identity: string;
}
export interface InitRepoOptions {
    /** Absolute path to the directory to create/populate. Must not exist yet, or must be empty. */
    targetDir: string;
    /** `product:<slug>` / `team:<slug>` scopes to seed, in addition to `org` (always created — never pass `org` here). */
    scopes: string[];
    /** git-host handle -> corporate identity mappings. Must be non-empty: a scope with no resolvable identity is refused. */
    identities: InitIdentity[];
    /**
     * Absolute path to a canonical-repo template root (the type catalog, CI
     * workflow, README, base `.lore/` files this scaffold is generated from).
     * Auto-located when omitted — tests inject the repo's own `template/` the
     * same way every other `@lore/core` test does.
     */
    templateRoot?: string;
    now?: Date;
}
export interface InitRepoResult {
    targetDir: string;
    /** Every scope actually created, `org` first. */
    scopes: string[];
    validation: ValidationResult;
}
/**
 * Scaffold a brand-new canonical repository: the type catalog, `.lore/`
 * config, a `CODEOWNERS` line per requested scope, the CI workflow and a
 * README — then self-validates the result and refuses to leave a tree
 * behind that does not pass `validate --full` with zero errors AND zero
 * warnings (docs/issues/0111). Never touches a git remote — no `git init`,
 * no push, no repo creation on the host.
 *
 * Everything invariant across deployments (the type catalog, the CI
 * workflow, the base `.lore/config.yml` and `.lore/grants.yml`, the README)
 * is copied byte-for-byte from `template/` rather than re-authored here —
 * `scaffoldRepo.test.ts` diffs the two so they can never drift into two
 * copies of the same catalog.
 */
export declare function initRepo(options: InitRepoOptions): Promise<InitRepoResult>;
//# sourceMappingURL=scaffoldRepo.d.ts.map