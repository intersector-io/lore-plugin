import { discoverRecords } from './discoverRecords.js';
import { parseFrontmatter } from './frontmatter.js';
import { hasAnyLoreConfig, readLoreConfigFiles } from './loreConfigFiles.js';
import { readRecordContext, runConfigRules, runRecordRules, runRepoRules, toRepoContext } from './pipeline.js';
import { filesystemRecordSource } from './recordSource.js';
import { readLinkTargets, readRecordId } from './rules/linkHelpers.js';
import { REPO_RULES, CONFIG_RULES } from './rules/index.js';
/** Paths whose diff always escalates changed-mode validation to full (Main Invariant: Type Records and Lore Config). */
const ESCALATION_ROOTS = ['org/type/', '.lore/'];
/**
 * Validate every record file under a knowledge repository root.
 *
 * This is the library seam: the CLI is a thin host over this function (and
 * `validateFiles`), per ADR-0002 — all rules live here, never in the CLI.
 */
export async function validateRepo(rootDir) {
    const files = await discoverRecords(rootDir);
    return validateFiles(rootDir, files);
}
/**
 * Does `rootDir` look like a knowledge repository at all — i.e. is "zero
 * records, zero errors" a real answer here, or the sound of validating
 * nothing?
 *
 * A knowledge repo is anchored by either a discoverable record (`org/`,
 * `products/<slug>/`, `teams/<slug>/`) or a `.lore/` config file. Neither
 * means the caller pointed somewhere else — the CI-gate footgun in
 * docs/issues/0092: a wrong working directory validated nothing and passed
 * forever. Lives here, beside `validateRepo`, because it is part of the
 * validate contract, not CLI argument handling (ADR-0002).
 */
export async function isKnowledgeRepoRoot(rootDir) {
    // `.lore/` first: three stats, and every repo scaffolded from the template
    // has it — so the common case never pays for the second tree walk.
    if (hasAnyLoreConfig(await readLoreConfigFiles(filesystemRecordSource(rootDir))))
        return true;
    return (await discoverRecords(rootDir)).length > 0;
}
/**
 * Validate a specific subset of record files (relative to `rootDir`). Used
 * directly by full-repo validation (`files` = every discovered record) and,
 * via `runValidation` below, as the shared engine `validateChanged` filters
 * down to changed-file diagnostics.
 */
export async function validateFiles(rootDir, files) {
    const { diagnostics } = await runValidation(filesystemRecordSource(rootDir), files);
    return { diagnostics, summary: summarize(diagnostics, files.length) };
}
/**
 * Runs every rule phase over `files` and returns both the diagnostics and
 * the per-file repo contexts (parsed frontmatter) — the latter is what
 * `validateChanged` needs to resolve changed files' record ids without a
 * second file-read pass.
 */
async function runValidation(source, files) {
    const diagnostics = [];
    const repoContexts = [];
    for (const file of files) {
        const { diagnostics: fileDiagnostics, repoContext } = await validateOneFile(source, file);
        diagnostics.push(...fileDiagnostics);
        if (repoContext)
            repoContexts.push(repoContext);
    }
    // Repo-level rules (e.g. ULID uniqueness) need every file's parsed
    // frontmatter at once; they run after the per-file pass completes.
    diagnostics.push(...runRepoRules(repoContexts, files));
    // Lore Config sanity (issue 0005) needs the raw `.lore/` files, which live
    // outside the record file set discoverRecords/validateFiles operates on.
    diagnostics.push(...runConfigRules(await readLoreConfigFiles(source), repoContexts));
    return { diagnostics, repoContexts };
}
function escalationReasonFor(changed) {
    for (const file of changed) {
        const candidates = [file.path, file.oldPath].filter((p) => Boolean(p));
        for (const candidate of candidates) {
            for (const root of ESCALATION_ROOTS) {
                if (candidate.startsWith(root)) {
                    return `changed path "${candidate}" is under ${root}`;
                }
            }
        }
    }
    return null;
}
/**
 * Mode selection per the Main Invariant (ADR-0002, CONTEXT.md): a diff
 * touching any Type Record (`org/type/`) or `.lore/` config escalates to
 * full-repo validation; otherwise only changed files are diagnosed. `--full`
 * (via `options.full`) forces full mode regardless of the diff.
 *
 * Changed mode still parses the *whole* tree (cheap — it's markdown
 * frontmatter, not a build) so repo-wide rules (ULID uniqueness, typed-link
 * integrity, supersession atomicity) see the full picture; only the
 * diagnostics surfaced are restricted. A repo-level diagnostic survives the
 * filter if it's anchored on a changed/deleted file directly, OR — pragmatic
 * design decision, see below — if its message references the path or record
 * id of a changed/deleted file (e.g. another file's dangling typed link to
 * an id a deleted record used to hold).
 *
 * That second clause is a substring heuristic over diagnostic messages, not
 * a structural cross-reference: it is intentionally conservative (it will
 * over-match a message that happens to quote an unrelated string equal to a
 * touched id/path, which is vanishingly unlikely given ULID/path shapes) in
 * exchange for not requiring every repo rule to declare which ids/paths it
 * consulted. It only applies to REPO_RULES/CONFIG_RULES diagnostics — a
 * per-file rule diagnostic on an unrelated, unchanged file is always
 * dropped, matching "an unchanged file's pre-existing violation must NOT
 * error in changed mode unless escalated."
 */
export async function validateChanged(rootDir, changed, options = {}) {
    const forced = options.full === true;
    const detectedReason = forced ? null : escalationReasonFor(changed);
    const mode = forced || detectedReason ? 'full' : 'changed';
    const source = filesystemRecordSource(rootDir);
    const allFiles = await discoverRecords(rootDir);
    if (mode === 'full') {
        const { diagnostics } = await runValidation(source, allFiles);
        return { diagnostics, summary: summarize(diagnostics, allFiles.length), mode: 'full', escalationReason: detectedReason };
    }
    const { diagnostics: allDiagnostics, repoContexts } = await runValidation(source, allFiles);
    const changedPaths = new Set(changed.filter((f) => f.status !== 'deleted').map((f) => f.path));
    const touchedPaths = new Set(changedPaths);
    for (const file of changed) {
        if (file.oldPath)
            touchedPaths.add(file.oldPath);
        if (file.status === 'deleted')
            touchedPaths.add(file.path);
    }
    const touchedIds = new Set();
    for (const ctx of repoContexts) {
        if (touchedPaths.has(ctx.file)) {
            const id = readRecordId(ctx.frontmatter);
            if (id)
                touchedIds.add(id);
        }
    }
    for (const file of changed) {
        if (file.status === 'deleted' && file.oldContent) {
            const value = parseFrontmatter(file.oldContent).value;
            const id = readRecordId(value);
            if (id)
                touchedIds.add(id);
            // Deleting a superseding record orphans its predecessors: the
            // supersession-atomicity diagnostic lands on the UNTOUCHED predecessor,
            // naming only its own id — so the deleted record's `supersedes` targets
            // must count as touched or the orphaning is silently filtered out here
            // (and in CI, which runs this same mode).
            for (const target of readLinkTargets(value, 'supersedes'))
                touchedIds.add(target);
        }
    }
    const repoLevelRuleNames = new Set([...REPO_RULES, ...CONFIG_RULES].map((rule) => rule.name));
    const diagnostics = allDiagnostics.filter((d) => {
        if (touchedPaths.has(d.file))
            return true;
        if (!repoLevelRuleNames.has(d.rule))
            return false;
        for (const p of touchedPaths)
            if (d.message.includes(p))
                return true;
        for (const id of touchedIds)
            if (d.message.includes(id))
                return true;
        return false;
    });
    const changedRecordFileCount = [...changedPaths].filter((p) => allFiles.includes(p)).length;
    return {
        diagnostics,
        summary: summarize(diagnostics, changedRecordFileCount),
        mode: 'changed',
        escalationReason: null,
    };
}
async function validateOneFile(source, file) {
    const ctx = await readRecordContext(source, file);
    return { diagnostics: runRecordRules(ctx), repoContext: toRepoContext(file, ctx.raw, ctx.frontmatter) };
}
export function summarize(diagnostics, fileCount) {
    let errors = 0;
    let warnings = 0;
    for (const diagnostic of diagnostics) {
        if (diagnostic.severity === 'error')
            errors += 1;
        else
            warnings += 1;
    }
    return { errors, warnings, files: fileCount };
}
//# sourceMappingURL=validate.js.map