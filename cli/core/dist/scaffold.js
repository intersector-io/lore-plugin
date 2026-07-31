import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stringify as stringifyYaml } from 'yaml';
import { discoverRecords } from './discoverRecords.js';
import { composeRecord, parseFrontmatter, splitFrontmatter } from './frontmatter.js';
import { readField } from './rules/fieldHelpers.js';
import { readRecordId } from './rules/linkHelpers.js';
import { isWellFormedScope } from './rules/loreConfigParse.js';
import { deriveScope } from './scope.js';
import { generatedStamp } from './actor.js';
import { generateUlid } from './ulid.js';
/**
 * Thrown by `scaffoldRecord`/`supersedeRecord` for refusals the caller must
 * surface structurally (docs/issues/0007: unknown type/scope exits 2 with a
 * structured diagnostic; supersede on a non-active record refuses). Carries
 * a `Diagnostic` so CLI and future K3 `propose_record` can report it the
 * same way `lore validate` reports schema diagnostics.
 */
export class ScaffoldError extends Error {
    diagnostic;
    constructor(diagnostic) {
        super(diagnostic.message);
        this.name = 'ScaffoldError';
        this.diagnostic = diagnostic;
    }
}
/**
 * Resolve a Type Record, fill its authoring template with a fresh ULID and
 * the given title/description/`generated` stamp, and write it under the target
 * scope directory (docs/issues/0007). Refuses unknown types and scope
 * directories that don't exist — both via `ScaffoldError`.
 */
export async function scaffoldRecord(options) {
    const { repoRoot, type, title } = options;
    const now = options.now ?? new Date();
    const scopeInfo = resolveScope(options.scope);
    if (!scopeInfo) {
        throw new ScaffoldError({
            rule: 'scaffold/invalid-scope',
            severity: 'error',
            file: '',
            pointer: '/scope',
            message: `--scope must be "org", "product:<slug>", or "team:<slug>": got "${options.scope}".`,
        });
    }
    const scopeAbsDir = path.join(repoRoot, ...scopeInfo.relativePath.split('/'));
    if (!(await pathExists(scopeAbsDir))) {
        throw new ScaffoldError({
            rule: 'scaffold/unknown-scope',
            severity: 'error',
            file: scopeInfo.relativePath,
            pointer: '/scope',
            message: `Scope directory "${scopeInfo.relativePath}" does not exist in this repo.`,
        });
    }
    const typeRecordRelPath = `org/type/${type}.md`;
    let typeRaw;
    try {
        typeRaw = await readFile(path.join(repoRoot, 'org', 'type', `${type}.md`), 'utf8');
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
    const typeFrontmatter = parseFrontmatter(typeRaw);
    if (typeFrontmatter.missing || typeFrontmatter.error || readField(typeFrontmatter.value, ['type']) !== 'type') {
        throw new ScaffoldError({
            rule: 'scaffold/unknown-type',
            severity: 'error',
            file: typeRecordRelPath,
            pointer: '/type',
            message: `"${typeRecordRelPath}" is not a valid Type Record (\`type: type\`).`,
        });
    }
    const template = extractTemplate(typeRaw);
    if (!template) {
        throw new ScaffoldError({
            rule: 'scaffold/missing-template',
            severity: 'error',
            file: typeRecordRelPath,
            pointer: '/body',
            message: `Type Record "${typeRecordRelPath}" has no fenced \`\`\`markdown authoring template under "## Template".`,
        });
    }
    const split = splitFrontmatter(template);
    const templateFrontmatter = split ? parseFrontmatter(template) : { missing: true, value: undefined };
    if (!split || templateFrontmatter.missing || templateFrontmatter.error || typeof templateFrontmatter.value !== 'object') {
        throw new ScaffoldError({
            rule: 'scaffold/malformed-template',
            severity: 'error',
            file: typeRecordRelPath,
            pointer: '/body',
            message: `Type Record "${typeRecordRelPath}" authoring template does not have a valid frontmatter block.`,
        });
    }
    const id = generateUlid(() => now);
    const frontmatterObj = templateFrontmatter.value;
    frontmatterObj.type = type;
    frontmatterObj.title = title;
    frontmatterObj.description = options.description ?? title;
    frontmatterObj.tags = Array.isArray(frontmatterObj.tags) ? frontmatterObj.tags : [];
    // OKF 0.2 trust family: `generated.by` is the ACTING identity, supplied by
    // the caller (the propose path passes its principal; the CLI its git
    // identity). A template-carried stamp is stripped either way, and with no
    // known actor the optional field is omitted — a placeholder actor would be
    // a fabricated fact.
    delete frontmatterObj.timestamp;
    delete frontmatterObj.generated;
    if (options.actor) {
        frontmatterObj.generated = generatedStamp(options.actor, now);
    }
    frontmatterObj['x-lore'] = {
        id,
        status: 'active',
        owners: options.owners ?? [],
        links: {
            supersedes: options.supersedes ?? [],
            implements: [],
            constrains: [],
            relates: [],
        },
        provenance: { source: 'authored' },
    };
    const finalRaw = composeRecord(stringifyYaml(frontmatterObj).trimEnd(), split.body);
    const typeDir = path.join(scopeAbsDir, type);
    await mkdir(typeDir, { recursive: true });
    // `|| 'record'` is `lore new`'s deliberate last resort: an interactive author
    // who typed an unsluggable title still gets a file. The propose path refuses
    // instead — nobody is there to see the name it would have picked.
    const slug = await uniqueSlug(typeDir, slugify(title) || 'record');
    const filePath = path.join(typeDir, `${slug}.md`);
    await writeFile(filePath, finalRaw, 'utf8');
    const relativePath = `${scopeInfo.relativePath}/${type}/${slug}.md`;
    return { filePath, relativePath, id, slug };
}
/**
 * Locate a predecessor by ULID (full-tree scan) and refuse unless it is
 * `active` — the ULID-lookup-and-active-check half of supersession, shared
 * by `supersedeRecord` (below) and `propose_record` (docs/issues/0019) so
 * the refusal (unknown ULID / non-active predecessor) is identical, and
 * structurally reported the same way (`ScaffoldError`), on both the CLI
 * file-editing path and the service in-worktree path.
 */
export async function locateActivePredecessor(repoRoot, ulid, 
// The operation named in the not-active refusal: 'supersede' (CLI + propose_record), 'revise' (propose_revision), 'retire' (propose_retirement), or 'delete' (propose_deletion).
opts = {}) {
    const files = await discoverRecords(repoRoot);
    let predecessor;
    for (const file of files) {
        const raw = await readFile(path.join(repoRoot, file), 'utf8');
        const parsed = parseFrontmatter(raw);
        if (parsed.missing || parsed.error)
            continue;
        if (readRecordId(parsed.value) === ulid) {
            predecessor = { file, raw, frontmatter: parsed.value };
            break;
        }
    }
    if (!predecessor) {
        throw new ScaffoldError({
            rule: 'scaffold/unknown-ulid',
            severity: 'error',
            file: '',
            pointer: '/x-lore/id',
            message: `No record with \`x-lore.id\` "${ulid}" was found in this repo.`,
        });
    }
    const status = readField(predecessor.frontmatter, ['x-lore', 'status']);
    if (status !== 'active') {
        throw new ScaffoldError({
            rule: 'scaffold/predecessor-not-active',
            severity: 'error',
            file: predecessor.file,
            pointer: '/x-lore/status',
            message: `Cannot ${opts.verb ?? 'supersede'} "${ulid}" (${predecessor.file}): status is "${String(status)}", not "active".`,
        });
    }
    const type = readField(predecessor.frontmatter, ['type']);
    if (typeof type !== 'string' || type.length === 0) {
        throw new ScaffoldError({
            rule: 'scaffold/predecessor-missing-type',
            severity: 'error',
            file: predecessor.file,
            pointer: '/type',
            message: `Predecessor "${ulid}" (${predecessor.file}) has no valid \`type\`.`,
        });
    }
    return { ...predecessor, type, scope: deriveScope(predecessor.file) };
}
/**
 * Locate the predecessor by ULID, refuse unless it is `active`, scaffold the
 * successor with `x-lore.links.supersedes: [<ulid>]` in the predecessor's
 * own type/scope, then flip the predecessor's status to `superseded` in
 * place with a targeted line replace — every other byte of the predecessor
 * file is untouched (docs/issues/0007 atomicity requirement; CONTEXT.md
 * "Supersession"). Delegates the lookup/refusal to `locateActivePredecessor`
 * so `propose_record`'s in-worktree path (docs/issues/0019) can't diverge on
 * what counts as a valid predecessor.
 */
export async function supersedeRecord(options) {
    const { repoRoot, ulid } = options;
    const predecessor = await locateActivePredecessor(repoRoot, ulid);
    const result = await scaffoldRecord({
        repoRoot,
        type: predecessor.type,
        scope: predecessor.scope,
        title: options.title,
        description: options.description,
        owners: options.owners,
        actor: options.actor,
        supersedes: [ulid],
        now: options.now,
    });
    const updatedRaw = flipStatusToSuperseded(predecessor.raw);
    await writeFile(path.join(repoRoot, predecessor.file), updatedRaw, 'utf8');
    return { ...result, predecessorPath: predecessor.file };
}
/**
 * Exported for reuse by `validateCandidate.ts`/`typeRecord.ts`
 * (docs/issues/0016): both need the same scope-string -> directory mapping
 * this file already owns.
 *
 * Well-formedness is `isWellFormedScope` — the exact same pattern
 * `.lore/grants.yml` and the access matrix are held to, so "is this a scope?"
 * has one answer everywhere. It used to accept any non-empty suffix
 * (`team:payment$` resolved to `teams/payment$`, a directory nothing can ever
 * hold), and downstream that typo surfaced as a *permissions* failure —
 * "team:payment$ is not in your contribute set", even for an admin
 * (docs/issues/0092).
 */
export function resolveScope(scope) {
    if (!isWellFormedScope(scope))
        return undefined;
    if (scope === 'org')
        return { relativePath: 'org' };
    const [kind, slug] = scope.split(':');
    return { relativePath: `${kind === 'product' ? 'products' : 'teams'}/${slug}` };
}
/** Exported for reuse by `typeRecord.ts` (docs/issues/0016 `getTypeAuthoringBundle`) — same fenced-template extraction `scaffoldRecord` uses. */
export function extractTemplate(raw) {
    const headingMatch = /^##\s+Template\s*$/m.exec(raw);
    if (!headingMatch)
        return undefined;
    const after = raw.slice(headingMatch.index);
    const fenceMatch = /```markdown\r?\n([\s\S]*?)```/.exec(after);
    return fenceMatch?.[1];
}
/**
 * Exported for reuse by `validateCandidate.ts` (docs/issues/0016) to compute
 * a candidate's would-be slug/path the same way scaffolding does.
 *
 * Returns `''` for a title with nothing sluggable in it (all punctuation, or
 * a script that transliterates to nothing). That emptiness is the caller's to
 * handle: it used to fall back to `'record'` here, so a title like "決定"
 * silently landed on `record.md` — a meaningless filename on the propose path,
 * where nobody chose it (docs/issues/0092). `lore new` keeps the fallback,
 * deliberately and visibly, at its own call site.
 */
export function slugify(title) {
    return title
        .normalize('NFKD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
async function uniqueSlug(dir, base) {
    const existing = new Set();
    try {
        for (const entry of await readdir(dir)) {
            if (entry.endsWith('.md'))
                existing.add(entry.slice(0, -3));
        }
    }
    catch {
        // Directory doesn't exist yet — created just above by the caller in the
        // normal path; an empty set is the correct "nothing to dedupe against".
    }
    if (!existing.has(base))
        return base;
    let suffix = 2;
    while (existing.has(`${base}-${suffix}`))
        suffix += 1;
    return `${base}-${suffix}`;
}
/**
 * Flips `x-lore.status: active` to `superseded` via a single targeted line
 * replace inside the frontmatter block, leaving every other byte — key
 * order, comments, spacing, line endings, the entire body — untouched.
 * Exported so `propose_record` (docs/issues/0019) can apply the identical edit
 * to a predecessor file inside its scratch worktree, ahead of the one commit
 * that lands both the successor and the flipped predecessor.
 *
 * The edited frontmatter is spliced back in at `frontmatterStart` rather than
 * the file being rebuilt around it (`---\n${fm}\n---\n${body}`): rebuilding
 * hardcodes LF delimiters, so on a CRLF checkout (git's default on Windows,
 * absent a `.gitattributes`) it silently rewrote the `---` lines' endings too
 * — turning the one-line supersession diff into a whole-block one and
 * breaking the very "surgical edit" atomicity this function exists to
 * guarantee. Splicing cannot touch a byte outside the status line, on any
 * platform, by construction.
 */
export function flipStatusToSuperseded(raw) {
    return flipActiveStatus(raw, 'superseded');
}
/**
 * The `retired` sibling (docs/issues/0071): `propose_retirement` flips an
 * active canon record to `retired` — same ULID, path, type, `generated`, links
 * and body — with the identical surgical edit, so a retirement proposal reads
 * as a one-line diff.
 */
export function flipStatusToRetired(raw) {
    return flipActiveStatus(raw, 'retired');
}
/** Opens a block-style `x-lore:` mapping (a trailing comment is fine; `x-lore: { … }` deliberately is not). */
const X_LORE_BLOCK = /^([ \t]*)x-lore:[ \t]*(?:#[^\r\n]*)?\r?$/;
/** `status: active` with an optional quote style and an optional trailing comment, all preserved in the replacement. */
const ACTIVE_STATUS = /^([ \t]*status:[ \t]*)(['"]?)active\2([^\S\n]*(?:#[^\n]*)?)$/;
/**
 * The `x-lore.status` line among the frontmatter's lines — its index and its
 * parts — or `undefined` when there isn't one to splice.
 *
 * Deliberately NOT "the first `status:` line in the block": a record may carry a
 * domain `status` attribute in its `x-type` block (and that block may be ordered
 * ahead of `x-lore`), and prose below the frontmatter may say the words too.
 * Flipping either would corrupt a field, leave the record active, and still
 * report success. So the search walks the `x-lore:` mapping — from its opening
 * line until the first line indented no deeper than it — and only accepts a
 * `status:` key at the block's own child indent.
 */
function findXLoreStatus(lines) {
    let blockIndent;
    let childIndent;
    for (const [index, line] of lines.entries()) {
        if (blockIndent === undefined) {
            const open = X_LORE_BLOCK.exec(line);
            if (open)
                blockIndent = open[1].length;
            continue;
        }
        if (line.trim() === '')
            continue;
        const indent = line.length - line.trimStart().length;
        if (indent <= blockIndent)
            return undefined; // the block ended without one
        childIndent ??= indent;
        if (indent !== childIndent)
            continue;
        const match = ACTIVE_STATUS.exec(line);
        if (match)
            return { index, match };
    }
    return undefined;
}
function flipActiveStatus(raw, next) {
    const split = splitFrontmatter(raw);
    // Unreachable from every service path (`locateActivePredecessor` only returns
    // records whose frontmatter parsed), so this stays a programming error.
    if (!split)
        throw new Error('Record has no frontmatter block to edit.');
    // Split on LF only and keep any `\r` inside the line, so a CRLF checkout
    // round-trips byte-for-byte (see this module's `flipStatusToSuperseded` note).
    const lines = split.frontmatterText.split('\n');
    const found = findXLoreStatus(lines);
    if (!found) {
        throw new ScaffoldError({
            rule: 'scaffold/status-line-not-found',
            severity: 'error',
            file: '',
            pointer: '/x-lore/status',
            message: 'Could not find a `status: active` line inside this record\'s `x-lore:` block. The status flip is a targeted ' +
                'line replace, so `x-lore` must be a block mapping with `status` on its own line — a flow-style ' +
                '`x-lore: { status: active }` has to be edited by hand.',
        });
    }
    const { match } = found;
    lines[found.index] = `${match[1]}${match[2]}${next}${match[2]}${match[3]}`;
    const { frontmatterStart } = split;
    return raw.slice(0, frontmatterStart) + lines.join('\n') + raw.slice(frontmatterStart + split.frontmatterText.length);
}
async function pathExists(target) {
    try {
        await access(target);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=scaffold.js.map