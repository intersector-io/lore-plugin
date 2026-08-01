import type { RecordSource } from './recordSource.js';
import type { LoreConfigInput } from './rules/index.js';
/**
 * Reads the three optional `.lore/` configuration files (issue 0005) through
 * `source` (docs/issues/0113 — the filesystem by default, a specific git ref
 * for the API's `validate_record`, so a stale checkout can't disagree with
 * canon about `.lore/` either). `.lore/` itself is optional in K0: when none
 * of the three files exist, every field is `undefined` and validate.ts skips
 * the config rule phase entirely rather than reporting "missing config"
 * diagnostics.
 */
export declare function readLoreConfigFiles(source: RecordSource): Promise<LoreConfigInput>;
/** True when at least one `.lore/` config file exists. */
export declare function hasAnyLoreConfig(input: LoreConfigInput): boolean;
//# sourceMappingURL=loreConfigFiles.d.ts.map