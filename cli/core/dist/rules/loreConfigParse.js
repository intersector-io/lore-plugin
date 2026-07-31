import { parse as parseYaml } from 'yaml';
/** Well-formed scope shapes (CONTEXT.md "Scope"): `org`, `product:<slug>`, `team:<slug>`. */
const SCOPE_PATTERN = /^(org|product:[a-z0-9][a-z0-9-]*|team:[a-z0-9][a-z0-9-]*)$/;
export function isWellFormedScope(value) {
    return typeof value === 'string' && SCOPE_PATTERN.test(value);
}
function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function parseError(file, err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
        rule: 'config/parse',
        severity: 'error',
        file,
        pointer: '',
        message: `${file} is not valid YAML: ${message}`,
    };
}
// ---- .lore/config.yml -------------------------------------------------
export const CONFIG_FILE = '.lore/config.yml';
const VALID_CLAIMS = new Set(['preferred_username', 'email']);
const VALID_STRICTNESS = new Set(['warn', 'strict']);
/**
 * Parses `.lore/config.yml` (STS claim choice + identity-map strictness).
 * A missing file uses documented defaults (`preferred_username` / `warn`),
 * never an error — the file is optional (issue 0005 acceptance criteria).
 */
export function parseConfigYml(raw) {
    if (raw === undefined) {
        return { claim: 'preferred_username', strictness: 'warn', errors: [] };
    }
    let value;
    try {
        value = parseYaml(raw);
    }
    catch (err) {
        return { claim: 'preferred_username', strictness: 'warn', errors: [parseError(CONFIG_FILE, err)] };
    }
    const errors = [];
    const obj = isPlainObject(value) ? value : {};
    if (!isPlainObject(value) && value !== null && value !== undefined) {
        errors.push({
            rule: 'config/parse',
            severity: 'error',
            file: CONFIG_FILE,
            pointer: '',
            message: `${CONFIG_FILE} must be a YAML mapping, got ${Array.isArray(value) ? 'a list' : typeof value}.`,
        });
    }
    let claim = 'preferred_username';
    if ('claim' in obj) {
        if (typeof obj.claim === 'string' && VALID_CLAIMS.has(obj.claim)) {
            claim = obj.claim;
        }
        else {
            errors.push({
                rule: 'config/parse',
                severity: 'error',
                file: CONFIG_FILE,
                pointer: '/claim',
                message: `\`claim\` must be one of preferred_username, email: got ${JSON.stringify(obj.claim)}.`,
            });
        }
    }
    let strictness = 'warn';
    if ('strictness' in obj) {
        if (typeof obj.strictness === 'string' && VALID_STRICTNESS.has(obj.strictness)) {
            strictness = obj.strictness;
        }
        else {
            errors.push({
                rule: 'config/parse',
                severity: 'error',
                file: CONFIG_FILE,
                pointer: '/strictness',
                message: `\`strictness\` must be one of warn, strict: got ${JSON.stringify(obj.strictness)}.`,
            });
        }
    }
    return { claim, strictness, errors };
}
// ---- .lore/identities.yml ----------------------------------------------
export const IDENTITIES_FILE = '.lore/identities.yml';
/**
 * Parses `.lore/identities.yml` (git-host handle -> corporate identity).
 * An absent or comment-only file (parses to `null`/`undefined`) is an empty
 * map, not an error — identities are opt-in as handles are added.
 */
export function parseIdentitiesYml(raw) {
    if (raw === undefined) {
        return { values: new Set(), errors: [] };
    }
    let value;
    try {
        value = parseYaml(raw);
    }
    catch (err) {
        return { values: new Set(), errors: [parseError(IDENTITIES_FILE, err)] };
    }
    if (value === null || value === undefined) {
        return { values: new Set(), errors: [] };
    }
    if (!isPlainObject(value)) {
        return {
            values: new Set(),
            errors: [
                {
                    rule: 'config/parse',
                    severity: 'error',
                    file: IDENTITIES_FILE,
                    pointer: '',
                    message: `${IDENTITIES_FILE} must be a YAML mapping of git-host handle to corporate identity, got ${Array.isArray(value) ? 'a list' : typeof value}.`,
                },
            ],
        };
    }
    const errors = [];
    const values = new Set();
    for (const [handle, identity] of Object.entries(value)) {
        if (typeof identity !== 'string' || identity.trim().length === 0) {
            errors.push({
                rule: 'config/parse',
                severity: 'error',
                file: IDENTITIES_FILE,
                pointer: `/${handle}`,
                message: `Identity map entry "${handle}" must map to a non-empty corporate identity string: got ${JSON.stringify(identity)}.`,
            });
            continue;
        }
        values.add(identity);
    }
    return { values, errors };
}
// ---- .lore/grants.yml ----------------------------------------------------
export const GRANTS_FILE = '.lore/grants.yml';
/**
 * Parses `.lore/grants.yml` (scope->scope namespace grants, PRD.md §8.8
 * R35): a top-level `grants:` list of `{ from, to }` entries, matching the
 * shape already shipped in template/.lore/grants.yml. Scope well-formedness
 * of `from`/`to` is deliberately NOT checked here — that's
 * `config/grant-scope`'s job, so a malformed-YAML fixture and a
 * malformed-scope fixture report under distinct rule ids.
 */
export function parseGrantsYml(raw) {
    if (raw === undefined) {
        return { entries: [], errors: [] };
    }
    let value;
    try {
        value = parseYaml(raw);
    }
    catch (err) {
        return { entries: [], errors: [parseError(GRANTS_FILE, err)] };
    }
    if (!isPlainObject(value)) {
        return {
            entries: [],
            errors: [
                {
                    rule: 'config/parse',
                    severity: 'error',
                    file: GRANTS_FILE,
                    pointer: '',
                    message: `${GRANTS_FILE} must be a YAML mapping with a top-level \`grants:\` list, got ${Array.isArray(value) ? 'a list' : typeof value}.`,
                },
            ],
        };
    }
    const grantsList = value.grants;
    if (grantsList === null || grantsList === undefined) {
        // No `grants:` key at all, or explicitly empty/null — treat as "no grants."
        return { entries: [], errors: [] };
    }
    if (!Array.isArray(grantsList)) {
        return {
            entries: [],
            errors: [
                {
                    rule: 'config/parse',
                    severity: 'error',
                    file: GRANTS_FILE,
                    pointer: '/grants',
                    message: `\`grants\` must be a list, got ${typeof grantsList}.`,
                },
            ],
        };
    }
    const errors = [];
    const entries = [];
    grantsList.forEach((entry, index) => {
        if (!isPlainObject(entry)) {
            errors.push({
                rule: 'config/parse',
                severity: 'error',
                file: GRANTS_FILE,
                pointer: `/grants/${index}`,
                message: `Grant entry ${index} must be a mapping with \`from\` and \`to\` scopes, got ${JSON.stringify(entry)}.`,
            });
            return;
        }
        const { from, to } = entry;
        let ok = true;
        if (typeof from !== 'string' || from.trim().length === 0) {
            errors.push({
                rule: 'config/parse',
                severity: 'error',
                file: GRANTS_FILE,
                pointer: `/grants/${index}/from`,
                message: `Grant entry ${index} \`from\` must be a non-empty string: got ${JSON.stringify(from)}.`,
            });
            ok = false;
        }
        if (typeof to !== 'string' || to.trim().length === 0) {
            errors.push({
                rule: 'config/parse',
                severity: 'error',
                file: GRANTS_FILE,
                pointer: `/grants/${index}/to`,
                message: `Grant entry ${index} \`to\` must be a non-empty string: got ${JSON.stringify(to)}.`,
            });
            ok = false;
        }
        if (ok)
            entries.push({ from: from, to: to, index });
    });
    return { entries, errors };
}
//# sourceMappingURL=loreConfigParse.js.map