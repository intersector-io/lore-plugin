/**
 * Scope is derived from a record's repo path, never stored in frontmatter
 * (ADR-0001, CONTEXT.md "Scope"). This is the single implementation shared
 * by scaffold's supersede path and the indexer — deriving scope twice would
 * risk the two disagreeing about what a path means.
 */
export function deriveScope(file) {
    const segments = file.split('/');
    if (segments[0] === 'org')
        return 'org';
    if (segments[0] === 'products' && segments[1])
        return `product:${segments[1]}`;
    if (segments[0] === 'teams' && segments[1])
        return `team:${segments[1]}`;
    throw new Error(`Cannot derive scope from record path "${file}".`);
}
//# sourceMappingURL=scope.js.map