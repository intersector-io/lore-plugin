import type { ValidationResult } from './types.js';
export interface ValidateCandidateOptions {
    /** `org`, `product:<slug>`, or `team:<slug>` (CONTEXT.md "Scope"). Needed, along with a `title` in the candidate frontmatter, to derive the candidate's would-be path `<scope>/<type>/<slug>.md` — required for `record/placement` and `record/ulid-unique` to run. Omitted, malformed, or no title to slug: both are skipped and a `candidate/path-not-derivable` warning names which of the three applied (docs/issues/0092). A title present but unsluggable is the fourth case and an error, `candidate/slug-empty`. */
    scope?: string;
}
/**
 * Validate a single in-memory candidate record (full markdown incl.
 * frontmatter) against a target repo's live catalog. Used by `validate_record`
 * and `propose_record` (docs/issues/0016) so an agent can check a draft before
 * it is ever written to disk.
 *
 * This is an *adapter*, not a second engine: it runs the same `pipeline.ts`
 * phases `validateFiles` runs (ADR-0002 — an agent whose proposal passes
 * `validate_record` but fails CI is the exact failure the shared core exists
 * to prevent). All it supplies is what genuinely differs — a record that has
 * no file on disk, overlaid on the repo's real parsed files so repo-level
 * rules can still ask cross-file questions of it, and `skipRules` for the two
 * rules that need a real placement in the tree unless `options.scope` lets us
 * derive one.
 *
 * "Same phases" means ALL of them, config included (docs/issues/0083). The
 * Lore Config phase used to be skipped here, so `config/owner-unmapped` — the
 * one config rule that anchors on a record — could not reach an author before
 * their record was canon: proposals validated clean and `lore validate` over
 * canon reported the unmapped owners afterwards. Config diagnostics anchored
 * on the *repo's* own `.lore/` files are still filtered out; they are never
 * the candidate's fault.
 */
export declare function validateCandidate(repoRoot: string, type: string, content: string, options?: ValidateCandidateOptions): Promise<ValidationResult>;
//# sourceMappingURL=validateCandidate.d.ts.map