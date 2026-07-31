import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from './frontmatter.js';
import { isNonEmptyString, readField } from './rules/fieldHelpers.js';
import { extractTemplate, ScaffoldError } from './scaffold.js';
/**
 * The catalog of authorable types (docs/issues/0044): every Type Record under
 * `org/type/`, sorted by slug. Without this the catalog is undiscoverable —
 * a type with no records yet is invisible to `list_records`, so an agent can
 * only guess a slug and read the 404 from `create_record`.
 *
 * Files under `org/type/` that aren't Type Records (`type: type`) are skipped
 * rather than surfaced as broken types: `type/meta-schema` already blocks
 * those from ever reaching `main`, so this is defensive against a mid-review
 * working tree, not a second validation.
 *
 * A repo with no `org/type/` directory is an empty catalog, not an error —
 * `validate_record` reports the missing catalog through the rule pipeline,
 * and whoami must not fail just because the repo is a fresh checkout.
 */
export async function listTypeRecords(repoRoot) {
    const typeDir = path.join(repoRoot, 'org', 'type');
    let entries;
    try {
        entries = await readdir(typeDir);
    }
    catch (err) {
        if (err?.code === 'ENOENT')
            return [];
        throw err;
    }
    // Sorted up front, then read concurrently: Promise.all resolves positionally,
    // so the catalog stays slug-ordered without a second sort.
    const read = entries
        .filter((entry) => entry.endsWith('.md'))
        .sort()
        .map(async (entry) => ({
        slug: entry.slice(0, -3),
        frontmatter: parseTypeRecordFrontmatter(await readFile(path.join(typeDir, entry), 'utf8')),
    }));
    const types = [];
    for (const { slug, frontmatter } of await Promise.all(read)) {
        if (!frontmatter)
            continue;
        const title = readField(frontmatter, ['title']);
        const description = readField(frontmatter, ['description']);
        types.push({
            slug,
            title: isNonEmptyString(title) ? title : '',
            description: isNonEmptyString(description) ? description : '',
        });
    }
    return types;
}
/**
 * Parsed frontmatter of a Type Record, or `undefined` when the file isn't one
 * (`type: type`). The single definition of "is this a Type Record" that
 * `listTypeRecords` skips on and `getTypeAuthoringBundle` refuses on — the two
 * must not drift on what they'll accept from `org/type/`.
 */
function parseTypeRecordFrontmatter(raw) {
    const parsed = parseFrontmatter(raw);
    if (parsed.missing || parsed.error || readField(parsed.value, ['type']) !== 'type')
        return undefined;
    return parsed.value;
}
/**
 * Resolve a Type Record and extract its authoring bundle (docs/issues/0016).
 * Reuses `scaffoldRecord`'s own template extraction and refusal shape
 * (`ScaffoldError`, rule `scaffold/unknown-type` / `scaffold/missing-template`)
 * so an unknown type is refused identically whether the caller is
 * `create_record` or `lore new`.
 *
 * @throws {ScaffoldError} unknown type, or a Type Record missing its template.
 */
export async function getTypeAuthoringBundle(repoRoot, type) {
    const typeRecordRelPath = `org/type/${type}.md`;
    let raw;
    try {
        raw = await readFile(path.join(repoRoot, 'org', 'type', `${type}.md`), 'utf8');
    }
    catch {
        throw new ScaffoldError({
            rule: 'scaffold/unknown-type',
            severity: 'error',
            file: typeRecordRelPath,
            pointer: '/type',
            message: `Unknown type "${type}": no Type Record at "${typeRecordRelPath}".`,
        });
    }
    const frontmatter = parseTypeRecordFrontmatter(raw);
    if (!frontmatter) {
        throw new ScaffoldError({
            rule: 'scaffold/unknown-type',
            severity: 'error',
            file: typeRecordRelPath,
            pointer: '/type',
            message: `"${typeRecordRelPath}" is not a valid Type Record (\`type: type\`).`,
        });
    }
    const template = extractTemplate(raw);
    if (!template) {
        throw new ScaffoldError({
            rule: 'scaffold/missing-template',
            severity: 'error',
            file: typeRecordRelPath,
            pointer: '/body',
            message: `Type Record "${typeRecordRelPath}" has no fenced \`\`\`markdown authoring template under "## Template".`,
        });
    }
    const xLoreType = readField(frontmatter, ['x-lore-type']);
    const requiredSections = Array.isArray(xLoreType?.['required-sections'])
        ? xLoreType['required-sections'].filter((s) => typeof s === 'string' && s.length > 0)
        : [];
    const classificationTest = typeof xLoreType?.['classification-test'] === 'string' ? xLoreType['classification-test'] : '';
    return {
        type,
        template,
        schema: xLoreType?.schema,
        requiredSections,
        checklist: extractSection(raw, 'Reviewer Checklist') ?? '',
        classificationTest,
    };
}
/** Raw body text of a `## <heading>` section: everything up to the next `## ` heading (or end of file), trimmed. */
function extractSection(raw, heading) {
    const pattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, 'm');
    const match = pattern.exec(raw);
    if (!match)
        return undefined;
    const after = raw.slice(match.index + match[0].length);
    const next = /^##\s+/m.exec(after);
    const body = next ? after.slice(0, next.index) : after;
    return body.trim();
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=typeRecord.js.map