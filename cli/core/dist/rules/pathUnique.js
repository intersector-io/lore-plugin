import { readRecordId } from './linkHelpers.js';
/**
 * One file, one record identity — a path must never be claimed by two
 * different `x-lore.id`s.
 *
 * A record's path is DERIVED, never chosen: `<scope>/<type>/<slug>.md` with the
 * slug slugified from the title. `lore new` resolves a title clash by suffixing
 * the slug (`scaffoldRecord`'s `uniqueSlug` — two records may legitimately
 * share a title at distinct paths, and canon hygiene reports that as a warning,
 * not an error). `propose_record` did not: it wrote `slugify(title)`
 * unconditionally, so a second record with an existing record's title landed ON
 * that record's file — replacing a canonical record and orphaning every
 * reference to its ULID, inside what looked like an ordinary new-record
 * proposal.
 *
 * `record/ulid-unique` cannot catch it: the incumbent's file is replaced in the
 * same commit, so the tree still carries exactly one record per ULID —
 * consistently, and consistently wrong.
 *
 * On disk this can never fire (a tree has one file per path), which is the
 * point: the collision only becomes visible when a *candidate* is overlaid on
 * the catalog at its would-be path (`validateCandidate`), which is exactly when
 * an agent can still be told to revise or supersede instead. Path-dependent
 * like `record/placement` — a candidate with no derivable path has no path to
 * collide on (see `validateCandidate`'s skip set).
 */
export const pathUnique = {
    name: 'record/path-unique',
    check(ctx) {
        const idsByFile = new Map();
        for (const { file, frontmatter } of ctx.files) {
            const id = readRecordId(frontmatter);
            if (!id)
                continue;
            const ids = idsByFile.get(file) ?? new Set();
            ids.add(id);
            idsByFile.set(file, ids);
        }
        const diagnostics = [];
        for (const [file, ids] of idsByFile) {
            if (ids.size < 2)
                continue;
            diagnostics.push({
                rule: 'record/path-unique',
                severity: 'error',
                file,
                pointer: '/title',
                message: `"${file}" is already occupied by a different record — that path is claimed by ${[...ids].sort().join(' and ')}. ` +
                    'A record\'s path is derived from its scope, type and title, so writing this one would overwrite the existing ' +
                    'record in place and orphan every reference to its id. To change the existing record use propose_revision; ' +
                    'to replace it, supersede it; otherwise give this record a distinct title.',
            });
        }
        diagnostics.sort((a, b) => a.file.localeCompare(b.file));
        return diagnostics;
    },
};
//# sourceMappingURL=pathUnique.js.map