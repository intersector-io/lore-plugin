/**
 * The rule pipeline: the single statement of *what runs, in what order,
 * under what preconditions* — and the one place a new rule phase is added.
 *
 * ADR-0002 exists because two implementations of validation would drift. That
 * argument does not stop at the CLI/API line: this repo previously wrote the
 * phase sequence out twice inside the core itself, once in `validate.ts` (a
 * record on disk) and once in `validateCandidate.ts` (a record proposed
 * in-memory), held together by a contract test that compared their outputs.
 * A test that catches drift is strictly worse than a structure that can't
 * drift, so the sequence lives here and both entry points call it.
 *
 * What legitimately differs between the two is *which records the rules see*
 * — a discovered tree, or that tree plus one candidate overlaid on it — and
 * which rules are meaningful for a record that has no place in the repo yet
 * (`skipRules`). Those are parameters, not reasons for a second pipeline.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from './frontmatter.js';
import { hasAnyLoreConfig } from './loreConfigFiles.js';
import { FRONTMATTER_PRESENCE_RULES, SECRET_RULES, SCHEMA_RULES, RECORD_RULES, TYPE_RULES, LINK_RULES, REPO_RULES, CONFIG_RULES, } from './rules/index.js';
function selected(rules, options) {
    const skip = options.skipRules;
    return skip ? rules.filter((rule) => !skip.has(rule.name)) : rules;
}
/**
 * Every per-record rule phase, in order, for one record — whether it came off
 * disk or arrived as a proposal.
 *
 * Two preconditions are encoded here rather than at the call sites:
 *
 * 1. Secret lint is a hard gate independent of frontmatter validity (PRD.md
 *    §13.9) — it must still catch a leaked key in a file whose frontmatter is
 *    broken, so it runs before the bail-out below.
 * 2. Everything after it assumes a successfully parsed frontmatter object.
 *    Running those rules against a missing/unparseable block would just pile
 *    "field is required" noise on top of the `frontmatter-parses` error, so a
 *    record that failed to parse stops here.
 */
export function runRecordRules(ctx, options = {}) {
    const run = (rules) => selected(rules, options).flatMap((rule) => rule.check(ctx));
    const diagnostics = run(FRONTMATTER_PRESENCE_RULES);
    diagnostics.push(...run(SECRET_RULES));
    if (ctx.frontmatter.missing || ctx.frontmatter.error)
        return diagnostics;
    diagnostics.push(...run(SCHEMA_RULES));
    diagnostics.push(...run(RECORD_RULES));
    diagnostics.push(...run(TYPE_RULES));
    diagnostics.push(...run(LINK_RULES));
    return diagnostics;
}
/**
 * The repo-level phase: rules needing a cross-file view (ULID uniqueness, type
 * resolution, link integrity, supersession atomicity). Runs once, after every
 * per-record pass, over the files whose frontmatter parsed.
 */
export function runRepoRules(files, allFiles, options = {}) {
    return selected(REPO_RULES, options).flatMap((rule) => rule.check({ files, allFiles }));
}
/**
 * The Lore Config phase (issue 0005): `.lore/` schema + referential checks,
 * which need the raw `.lore/` file contents on top of every record's parsed
 * frontmatter. `.lore/` is optional (K0), so a repo with none of the three
 * files skips the phase entirely rather than reporting "missing config".
 *
 * Lives here, beside the other phases, because a candidate is subject to it
 * too (docs/issues/0083): `config/owner-unmapped` is the one config rule that
 * anchors on a *record*, and a candidate that skipped it validated clean
 * through `propose_record` only for `lore validate` to report the unmapped
 * owner once it was already canon.
 */
export function runConfigRules(config, files, options = {}) {
    if (!hasAnyLoreConfig(config))
        return [];
    return selected(CONFIG_RULES, options).flatMap((rule) => rule.check({ ...config, files }));
}
/**
 * A record's context for the repo-level phase, or `undefined` when its
 * frontmatter didn't parse — repo rules only ever see parseable records (the
 * parse failure is already reported against the file itself by
 * `frontmatter-parses`, and a record with no readable frontmatter has no id or
 * links to cross-reference).
 */
export function toRepoContext(file, raw, 
/** Pass an existing parse to avoid a second one — `validateFiles` already parsed this record to run its per-record rules. */
frontmatter = parseFrontmatter(raw)) {
    if (frontmatter.missing || frontmatter.error)
        return undefined;
    return { file, frontmatter: frontmatter.value, raw };
}
/** Reads one record off disk into the context every per-record rule takes. */
export async function readRecordContext(rootDir, file) {
    const raw = await readFile(path.join(rootDir, file), 'utf8');
    return { file, raw, frontmatter: parseFrontmatter(raw) };
}
/**
 * Loads the repo-level contexts for `files` without diagnosing them — what
 * candidate validation needs to overlay a proposal on the live catalog and ask
 * repo-wide questions of the result.
 */
export async function loadRepoContexts(rootDir, files) {
    const contexts = [];
    for (const file of files) {
        const raw = await readFile(path.join(rootDir, file), 'utf8');
        const context = toRepoContext(file, raw);
        if (context)
            contexts.push(context);
    }
    return contexts;
}
//# sourceMappingURL=pipeline.js.map