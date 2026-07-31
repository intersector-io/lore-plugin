/**
 * Discover record files under a knowledge repository root.
 *
 * Only `.md` files under `org/`, `products/<slug>/`, `teams/<slug>/` are
 * records; everything else (docs/, .lore/, dotfiles, other top-level paths)
 * is ignored, and OKF reserved filenames are skipped wherever they appear.
 * Returns paths relative to `rootDir`, using forward slashes.
 */
export declare function discoverRecords(rootDir: string): Promise<string[]>;
//# sourceMappingURL=discoverRecords.d.ts.map