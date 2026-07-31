/** The four typed-link edges under `x-lore.links` (CONTEXT.md "Typed Link"). */
export declare const LINK_TYPES: readonly ["supersedes", "implements", "constrains", "relates"];
export type LinkType = (typeof LINK_TYPES)[number];
/** Reads one `x-lore.links.<type>` list, tolerating a missing/malformed value (schema rules report those separately). */
export declare function readLinkTargets(frontmatter: unknown, type: LinkType): string[];
/** Reads `x-lore.id`, tolerating a missing/malformed value. */
export declare function readRecordId(frontmatter: unknown): string | undefined;
//# sourceMappingURL=linkHelpers.d.ts.map