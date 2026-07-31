import { readdir } from 'node:fs/promises';
import path from 'node:path';
// OKF reserved filenames: never records, regardless of directory.
const RESERVED_BASENAMES = new Set(['index.md', 'log.md']);
// Record roots relative to a validated repo root (PRD.md §7.1 layout).
const RECORD_ROOTS = ['org', 'products', 'teams'];
/**
 * Discover record files under a knowledge repository root.
 *
 * Only `.md` files under `org/`, `products/<slug>/`, `teams/<slug>/` are
 * records; everything else (docs/, .lore/, dotfiles, other top-level paths)
 * is ignored, and OKF reserved filenames are skipped wherever they appear.
 * Returns paths relative to `rootDir`, using forward slashes.
 */
export async function discoverRecords(rootDir) {
    const found = [];
    for (const root of RECORD_ROOTS) {
        await walk(rootDir, root, found);
    }
    found.sort();
    return found;
}
async function walk(rootDir, relativeDir, found) {
    const absoluteDir = path.join(rootDir, relativeDir);
    let entries;
    try {
        entries = await readdir(absoluteDir, { withFileTypes: true });
    }
    catch {
        // Root directory (e.g. teams/) may not exist in every repo; that's fine.
        return;
    }
    for (const entry of entries) {
        const entryRelative = `${relativeDir}/${entry.name}`;
        if (entry.name.startsWith('.'))
            continue;
        if (entry.isDirectory()) {
            await walk(rootDir, entryRelative, found);
            continue;
        }
        if (!entry.isFile())
            continue;
        if (!entry.name.endsWith('.md'))
            continue;
        if (RESERVED_BASENAMES.has(entry.name))
            continue;
        found.push(entryRelative);
    }
}
//# sourceMappingURL=discoverRecords.js.map