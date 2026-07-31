import type { LoreConfigInput } from './rules/index.js';
/**
 * Reads the three optional `.lore/` configuration files (issue 0005).
 * `.lore/` itself is optional in K0: when none of the three files exist,
 * every field is `undefined` and validate.ts skips the config rule phase
 * entirely rather than reporting "missing config" diagnostics.
 */
export declare function readLoreConfigFiles(rootDir: string): Promise<LoreConfigInput>;
/** True when at least one `.lore/` config file exists. */
export declare function hasAnyLoreConfig(input: LoreConfigInput): boolean;
//# sourceMappingURL=loreConfigFiles.d.ts.map