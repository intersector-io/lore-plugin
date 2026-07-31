import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);
function toForwardSlash(p) {
    return p.replace(/\\/g, '/');
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
export async function getChangedFiles(repoRoot, baseRef) {
    const { stdout } = await execFileAsync('git', ['diff', '--name-status', '-M', `${baseRef}...HEAD`], { cwd: repoRoot, maxBuffer: 32 * 1024 * 1024 });
    const changed = [];
    for (const line of stdout.split('\n')) {
        const trimmed = line.trimEnd();
        if (!trimmed)
            continue;
        const cols = trimmed.split('\t');
        const code = cols[0];
        if (!code)
            continue;
        if (code.startsWith('R') || code.startsWith('C')) {
            const [, oldPath, newPath] = cols;
            if (!oldPath || !newPath)
                continue;
            changed.push({ path: toForwardSlash(newPath), status: 'renamed', oldPath: toForwardSlash(oldPath) });
            continue;
        }
        const filePath = cols[1];
        if (!filePath)
            continue;
        if (code === 'A')
            changed.push({ path: toForwardSlash(filePath), status: 'added' });
        else if (code === 'M')
            changed.push({ path: toForwardSlash(filePath), status: 'modified' });
        else if (code === 'D')
            changed.push({ path: toForwardSlash(filePath), status: 'deleted' });
        // Other codes (T type-change, U unmerged) are out of scope for K0.
    }
    await Promise.all(changed
        .filter((f) => f.status === 'deleted')
        .map(async (f) => {
        f.oldContent = await tryGitShow(repoRoot, baseRef, f.path);
    }));
    return changed;
}
async function tryGitShow(repoRoot, ref, filePath) {
    try {
        const { stdout } = await execFileAsync('git', ['show', `${ref}:${filePath}`], {
            cwd: repoRoot,
            maxBuffer: 16 * 1024 * 1024,
        });
        return stdout;
    }
    catch {
        // Best-effort: e.g. the file was added and deleted within the same diff range's history in a way `git show` can't resolve. Cross-reference detection for that id is simply skipped.
        return undefined;
    }
}
//# sourceMappingURL=git.js.map