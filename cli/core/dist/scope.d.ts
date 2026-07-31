/**
 * Scope is derived from a record's repo path, never stored in frontmatter
 * (ADR-0001, CONTEXT.md "Scope"). This is the single implementation shared
 * by scaffold's supersede path and the indexer — deriving scope twice would
 * risk the two disagreeing about what a path means.
 */
export declare function deriveScope(file: string): string;
//# sourceMappingURL=scope.d.ts.map