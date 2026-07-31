import type { ChangedFile } from './git.js';
import type { Diagnostic, ValidationResult } from './types.js';
export type ValidationMode = 'changed' | 'full';
export interface ValidationModeResult extends ValidationResult {
    mode: ValidationMode;
    /** Why validation escalated to full mode, or `null` when it didn't (including when `--full` was passed explicitly). */
    escalationReason: string | null;
}
/**
 * Validate every record file under a knowledge repository root.
 *
 * This is the library seam: the CLI is a thin host over this function (and
 * `validateFiles`), per ADR-0002 — all rules live here, never in the CLI.
 */
export declare function validateRepo(rootDir: string): Promise<ValidationResult>;
/**
 * Does `rootDir` look like a knowledge repository at all — i.e. is "zero
 * records, zero errors" a real answer here, or the sound of validating
 * nothing?
 *
 * A knowledge repo is anchored by either a discoverable record (`org/`,
 * `products/<slug>/`, `teams/<slug>/`) or a `.lore/` config file. Neither
 * means the caller pointed somewhere else — the CI-gate footgun in
 * docs/issues/0092: a wrong working directory validated nothing and passed
 * forever. Lives here, beside `validateRepo`, because it is part of the
 * validate contract, not CLI argument handling (ADR-0002).
 */
export declare function isKnowledgeRepoRoot(rootDir: string): Promise<boolean>;
/**
 * Validate a specific subset of record files (relative to `rootDir`). Used
 * directly by full-repo validation (`files` = every discovered record) and,
 * via `runValidation` below, as the shared engine `validateChanged` filters
 * down to changed-file diagnostics.
 */
export declare function validateFiles(rootDir: string, files: string[]): Promise<ValidationResult>;
/**
 * Mode selection per the Main Invariant (ADR-0002, CONTEXT.md): a diff
 * touching any Type Record (`org/type/`) or `.lore/` config escalates to
 * full-repo validation; otherwise only changed files are diagnosed. `--full`
 * (via `options.full`) forces full mode regardless of the diff.
 *
 * Changed mode still parses the *whole* tree (cheap — it's markdown
 * frontmatter, not a build) so repo-wide rules (ULID uniqueness, typed-link
 * integrity, supersession atomicity) see the full picture; only the
 * diagnostics surfaced are restricted. A repo-level diagnostic survives the
 * filter if it's anchored on a changed/deleted file directly, OR — pragmatic
 * design decision, see below — if its message references the path or record
 * id of a changed/deleted file (e.g. another file's dangling typed link to
 * an id a deleted record used to hold).
 *
 * That second clause is a substring heuristic over diagnostic messages, not
 * a structural cross-reference: it is intentionally conservative (it will
 * over-match a message that happens to quote an unrelated string equal to a
 * touched id/path, which is vanishingly unlikely given ULID/path shapes) in
 * exchange for not requiring every repo rule to declare which ids/paths it
 * consulted. It only applies to REPO_RULES/CONFIG_RULES diagnostics — a
 * per-file rule diagnostic on an unrelated, unchanged file is always
 * dropped, matching "an unchanged file's pre-existing violation must NOT
 * error in changed mode unless escalated."
 */
export declare function validateChanged(rootDir: string, changed: ChangedFile[], options?: {
    full?: boolean;
}): Promise<ValidationModeResult>;
export declare function summarize(diagnostics: Diagnostic[], fileCount: number): ValidationResult['summary'];
//# sourceMappingURL=validate.d.ts.map