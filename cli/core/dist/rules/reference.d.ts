import type { RepoRule } from './types.js';
/** One body markdown link resolved to a repo-relative `.md` path (external URLs/pure anchors excluded). */
export interface BodyLink {
    rawTarget: string;
    resolvedPath: string;
}
/**
 * Extracts every internal body markdown link from `raw` (a record's full
 * file content, frontmatter included — fenced code blocks are stripped
 * first). Shared by the `links/reference` CI rule (warns on unresolved
 * targets) and the indexer's `references` edge harvesting (docs/issues/0009)
 * — one extraction pass so the two can never disagree on what counts as a
 * body link.
 */
export declare function extractBodyLinks(file: string, raw: string): BodyLink[];
/**
 * Reference (docs/issues/0004-link-rules.md, CONTEXT.md "Reference"): a body
 * markdown link whose target resolves to a path inside the repo (relative or
 * root-absolute, OKF-style with or without the `.md` suffix) but that file
 * doesn't exist — warning, never an error. External URLs and pure anchors
 * are ignored; the indexer harvests every such link as a `references` edge
 * regardless of whether it resolves.
 */
export declare const reference: RepoRule;
//# sourceMappingURL=reference.d.ts.map