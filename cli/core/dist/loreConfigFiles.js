const RELATIVE_PATHS = {
    configRaw: '.lore/config.yml',
    identitiesRaw: '.lore/identities.yml',
    grantsRaw: '.lore/grants.yml',
};
/**
 * Reads the three optional `.lore/` configuration files (issue 0005) through
 * `source` (docs/issues/0113 — the filesystem by default, a specific git ref
 * for the API's `validate_record`, so a stale checkout can't disagree with
 * canon about `.lore/` either). `.lore/` itself is optional in K0: when none
 * of the three files exist, every field is `undefined` and validate.ts skips
 * the config rule phase entirely rather than reporting "missing config"
 * diagnostics.
 */
export async function readLoreConfigFiles(source) {
    const [configRaw, identitiesRaw, grantsRaw] = await Promise.all([
        source.readFile(RELATIVE_PATHS.configRaw),
        source.readFile(RELATIVE_PATHS.identitiesRaw),
        source.readFile(RELATIVE_PATHS.grantsRaw),
    ]);
    return { configRaw, identitiesRaw, grantsRaw };
}
/** True when at least one `.lore/` config file exists. */
export function hasAnyLoreConfig(input) {
    return input.configRaw !== undefined || input.identitiesRaw !== undefined || input.grantsRaw !== undefined;
}
//# sourceMappingURL=loreConfigFiles.js.map