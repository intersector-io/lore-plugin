import { readFile } from 'node:fs/promises';
import path from 'node:path';
const RELATIVE_PATHS = {
    configRaw: '.lore/config.yml',
    identitiesRaw: '.lore/identities.yml',
    grantsRaw: '.lore/grants.yml',
};
async function tryReadFile(absolutePath) {
    try {
        return await readFile(absolutePath, 'utf8');
    }
    catch (err) {
        if (err?.code === 'ENOENT')
            return undefined;
        throw err;
    }
}
/**
 * Reads the three optional `.lore/` configuration files (issue 0005).
 * `.lore/` itself is optional in K0: when none of the three files exist,
 * every field is `undefined` and validate.ts skips the config rule phase
 * entirely rather than reporting "missing config" diagnostics.
 */
export async function readLoreConfigFiles(rootDir) {
    const [configRaw, identitiesRaw, grantsRaw] = await Promise.all([
        tryReadFile(path.join(rootDir, RELATIVE_PATHS.configRaw)),
        tryReadFile(path.join(rootDir, RELATIVE_PATHS.identitiesRaw)),
        tryReadFile(path.join(rootDir, RELATIVE_PATHS.grantsRaw)),
    ]);
    return { configRaw, identitiesRaw, grantsRaw };
}
/** True when at least one `.lore/` config file exists. */
export function hasAnyLoreConfig(input) {
    return input.configRaw !== undefined || input.identitiesRaw !== undefined || input.grantsRaw !== undefined;
}
//# sourceMappingURL=loreConfigFiles.js.map