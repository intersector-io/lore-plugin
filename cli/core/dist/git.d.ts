/** One file touched between `baseRef` and `HEAD`, from the CLI's perspective (`lore validate --changed`). */
export interface ChangedFile {
    /** Current path (relative to repo root, forward-slashed). For a pure delete, this is the deleted path. */
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
    /** Set only for renames: the path before the rename. */
    oldPath?: string;
    /**
     * Set only for deletes, best-effort: the deleted file's content as of
     * `baseRef`, via `git show`. Lets changed-mode validation recognize when a
     * repo-level violation elsewhere references the id a deleted record used
     * to hold (see validateChanged in validate.ts).
     */
    oldContent?: string;
}
/**
 * Computes the file-level diff between `baseRef` and `HEAD` in the git
 * repository at `repoRoot` (which may differ from the process cwd — the
 * repo being validated, not the CLI's own checkout). Uses
 * `git diff --name-status -M <baseRef>...HEAD` (merge-base diff, matching
 * "what did this branch change relative to where it forked from base"),
 * with rename detection enabled explicitly (`-M`; off by default for
 * `--name-status`).
 */
export declare function getChangedFiles(repoRoot: string, baseRef: string): Promise<ChangedFile[]>;
//# sourceMappingURL=git.d.ts.map