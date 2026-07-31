import type { Diagnostic } from './types.js';
/**
 * Thrown by `scaffoldRecord`/`supersedeRecord` for refusals the caller must
 * surface structurally (docs/issues/0007: unknown type/scope exits 2 with a
 * structured diagnostic; supersede on a non-active record refuses). Carries
 * a `Diagnostic` so CLI and future K3 `propose_record` can report it the
 * same way `lore validate` reports schema diagnostics.
 */
export declare class ScaffoldError extends Error {
    readonly diagnostic: Diagnostic;
    constructor(diagnostic: Diagnostic);
}
export interface ScaffoldRecordOptions {
    /** Absolute path to the target canonical repo root. */
    repoRoot: string;
    /** Type slug, e.g. `adr`, `decision`. */
    type: string;
    /** `org`, `product:<slug>`, or `team:<slug>` (CONTEXT.md "Scope"). */
    scope: string;
    title: string;
    /** Defaults to `title` when omitted — every record requires a non-empty description. */
    description?: string;
    owners?: string[];
    /**
     * The acting identity for the OKF 0.2 `generated.by` stamp, already in
     * actor form (`humanActor(...)`). Omitted ⇒ the record ships without the
     * optional `generated` family — never a guessed or scavenged actor.
     */
    actor?: string;
    /** `x-lore.links.supersedes` targets; used by `supersedeRecord`. */
    supersedes?: string[];
    /** Injectable for deterministic tests. */
    now?: Date;
}
export interface ScaffoldRecordResult {
    /** Absolute path to the written file. */
    filePath: string;
    /** Path relative to `repoRoot`, forward-slashed. */
    relativePath: string;
    id: string;
    slug: string;
}
export interface SupersedeRecordOptions {
    repoRoot: string;
    /** ULID of the predecessor record to supersede. */
    ulid: string;
    title: string;
    description?: string;
    owners?: string[];
    /** The acting identity for `generated.by` (see `ScaffoldRecordOptions.actor`) — the superseder, never the predecessor's owners. */
    actor?: string;
    now?: Date;
}
export interface SupersedeRecordResult extends ScaffoldRecordResult {
    /** Path of the predecessor record, relative to `repoRoot`, whose status was flipped. */
    predecessorPath: string;
}
/**
 * A located, supersession-eligible predecessor: the file, its raw text and
 * parsed frontmatter, plus the `type`/`scope` derived from it (so a caller
 * building a successor doesn't have to re-derive them). Returned by
 * `locateActivePredecessor`, shared by `supersedeRecord` (CLI, template-based
 * successor) and `propose_record` (docs/issues/0019, caller-submitted-content
 * successor) — the ULID-lookup-and-active-check is the one piece of
 * supersession logic both paths need identically; how the successor's
 * content itself gets built differs by design (template fill vs. submitted
 * markdown) and stays separate in each caller.
 */
export interface PredecessorRecord {
    file: string;
    raw: string;
    frontmatter: unknown;
    type: string;
    scope: string;
}
/**
 * Resolve a Type Record, fill its authoring template with a fresh ULID and
 * the given title/description/`generated` stamp, and write it under the target
 * scope directory (docs/issues/0007). Refuses unknown types and scope
 * directories that don't exist — both via `ScaffoldError`.
 */
export declare function scaffoldRecord(options: ScaffoldRecordOptions): Promise<ScaffoldRecordResult>;
/**
 * Locate a predecessor by ULID (full-tree scan) and refuse unless it is
 * `active` — the ULID-lookup-and-active-check half of supersession, shared
 * by `supersedeRecord` (below) and `propose_record` (docs/issues/0019) so
 * the refusal (unknown ULID / non-active predecessor) is identical, and
 * structurally reported the same way (`ScaffoldError`), on both the CLI
 * file-editing path and the service in-worktree path.
 */
export declare function locateActivePredecessor(repoRoot: string, ulid: string, opts?: {
    verb?: 'supersede' | 'revise' | 'retire' | 'delete';
}): Promise<PredecessorRecord>;
/**
 * Locate the predecessor by ULID, refuse unless it is `active`, scaffold the
 * successor with `x-lore.links.supersedes: [<ulid>]` in the predecessor's
 * own type/scope, then flip the predecessor's status to `superseded` in
 * place with a targeted line replace — every other byte of the predecessor
 * file is untouched (docs/issues/0007 atomicity requirement; CONTEXT.md
 * "Supersession"). Delegates the lookup/refusal to `locateActivePredecessor`
 * so `propose_record`'s in-worktree path (docs/issues/0019) can't diverge on
 * what counts as a valid predecessor.
 */
export declare function supersedeRecord(options: SupersedeRecordOptions): Promise<SupersedeRecordResult>;
export interface ScopeInfo {
    /** Path relative to repo root, e.g. `org`, `products/acme`. */
    relativePath: string;
}
/**
 * Exported for reuse by `validateCandidate.ts`/`typeRecord.ts`
 * (docs/issues/0016): both need the same scope-string -> directory mapping
 * this file already owns.
 *
 * Well-formedness is `isWellFormedScope` — the exact same pattern
 * `.lore/grants.yml` and the access matrix are held to, so "is this a scope?"
 * has one answer everywhere. It used to accept any non-empty suffix
 * (`team:payment$` resolved to `teams/payment$`, a directory nothing can ever
 * hold), and downstream that typo surfaced as a *permissions* failure —
 * "team:payment$ is not in your contribute set", even for an admin
 * (docs/issues/0092).
 */
export declare function resolveScope(scope: string): ScopeInfo | undefined;
/** Exported for reuse by `typeRecord.ts` (docs/issues/0016 `getTypeAuthoringBundle`) — same fenced-template extraction `scaffoldRecord` uses. */
export declare function extractTemplate(raw: string): string | undefined;
/**
 * Exported for reuse by `validateCandidate.ts` (docs/issues/0016) to compute
 * a candidate's would-be slug/path the same way scaffolding does.
 *
 * Returns `''` for a title with nothing sluggable in it (all punctuation, or
 * a script that transliterates to nothing). That emptiness is the caller's to
 * handle: it used to fall back to `'record'` here, so a title like "決定"
 * silently landed on `record.md` — a meaningless filename on the propose path,
 * where nobody chose it (docs/issues/0092). `lore new` keeps the fallback,
 * deliberately and visibly, at its own call site.
 */
export declare function slugify(title: string): string;
/**
 * Flips `x-lore.status: active` to `superseded` via a single targeted line
 * replace inside the frontmatter block, leaving every other byte — key
 * order, comments, spacing, line endings, the entire body — untouched.
 * Exported so `propose_record` (docs/issues/0019) can apply the identical edit
 * to a predecessor file inside its scratch worktree, ahead of the one commit
 * that lands both the successor and the flipped predecessor.
 *
 * The edited frontmatter is spliced back in at `frontmatterStart` rather than
 * the file being rebuilt around it (`---\n${fm}\n---\n${body}`): rebuilding
 * hardcodes LF delimiters, so on a CRLF checkout (git's default on Windows,
 * absent a `.gitattributes`) it silently rewrote the `---` lines' endings too
 * — turning the one-line supersession diff into a whole-block one and
 * breaking the very "surgical edit" atomicity this function exists to
 * guarantee. Splicing cannot touch a byte outside the status line, on any
 * platform, by construction.
 */
export declare function flipStatusToSuperseded(raw: string): string;
/**
 * The `retired` sibling (docs/issues/0071): `propose_retirement` flips an
 * active canon record to `retired` — same ULID, path, type, `generated`, links
 * and body — with the identical surgical edit, so a retirement proposal reads
 * as a one-line diff.
 */
export declare function flipStatusToRetired(raw: string): string;
//# sourceMappingURL=scaffold.d.ts.map