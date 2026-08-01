import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { humanActor, validateRepo, validateChanged, getChangedFiles, isKnowledgeRepoRoot, scaffoldRecord, supersedeRecord, initRepo, ScaffoldError, InitPostconditionError, } from '@lore/core';
import { formatDiagnosticLine, formatHuman, toJsonOutput } from './format.js';
const execFileAsync = promisify(execFile);
/**
 * The CLI's acting identity for the OKF 0.2 `generated.by` stamp: the repo's
 * effective `git config user.email`, in actor form. No git identity (or no
 * git at all) ⇒ undefined, and the record ships without the optional
 * `generated` family — never a guessed actor (CONTEXT.md "Generated").
 */
async function gitActor(repoRoot) {
    try {
        const { stdout } = await execFileAsync('git', ['config', 'user.email'], { cwd: repoRoot });
        const email = stdout.trim();
        return email ? humanActor(email) : undefined;
    }
    catch {
        return undefined;
    }
}
/** Usage/internal failure exit code (docs/issues/0001-walking-skeleton-validate.md). */
const EXIT_USAGE_ERROR = 2;
const EXIT_VALIDATION_ERRORS = 1;
const EXIT_OK = 0;
const USAGE = 'Usage:\n' +
    '  lore validate [path] [--format human|json] [--changed <base-ref>] [--full]\n' +
    '  lore new <type> --scope <org|product:slug|team:slug> --title <title> [--repo <path>] [--description <desc>] [--format human|json]\n' +
    '  lore supersede <ulid> --title <title> [--repo <path>] [--description <desc>] [--format human|json]\n' +
    '  lore init <dir> [--scopes <product:slug|team:slug>[,...]]... --identity <handle=corporate-identity>... [--format human|json]\n';
/**
 * Programmatic CLI entry point. The `lore` binary (src/cli.ts) is a thin
 * wrapper over this function — everything a test needs to assert (exit
 * code, stdout/stderr) is reachable here without spawning a process.
 */
export async function main(argv, io) {
    const [command, ...rest] = argv;
    // Asking for help is not an error: usage goes to stdout, exit 0. Handled
    // before dispatch so `lore --help` and `lore <command> --help` both work.
    // `lore-indexer` and `lore-harvest` hold the identical contract.
    //
    // Only `--help` is matched inside `rest`, never `-h` or the bare word `help`:
    // those are legitimate flag *values* (`--title -h`), and treating one as a
    // help request would print usage and exit 0 without writing the record — a
    // silent success, the worst failure shape for a CLI an agent drives. `--help`
    // is safe there because the flag parsers reject any value starting with `--`.
    if (command === undefined || isHelpCommand(command) || rest.includes('--help')) {
        io.stdout(USAGE);
        return EXIT_OK;
    }
    if (command === 'validate') {
        return runValidate(rest, io);
    }
    if (command === 'new') {
        return runNew(rest, io);
    }
    if (command === 'supersede') {
        return runSupersede(rest, io);
    }
    if (command === 'init') {
        return runInit(rest, io);
    }
    io.stderr(`Unknown command: ${command}\n${USAGE}`);
    return EXIT_USAGE_ERROR;
}
function isHelpCommand(arg) {
    return arg === '--help' || arg === '-h' || arg === 'help';
}
async function runValidate(args, io) {
    let targetPath;
    let format = 'human';
    let changedBaseRef;
    let full = false;
    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === '--format') {
            const value = args[i + 1];
            if (value !== 'human' && value !== 'json') {
                io.stderr(`--format must be "human" or "json", got: ${value ?? '(none)'}\n`);
                return EXIT_USAGE_ERROR;
            }
            format = value;
            i += 1;
            continue;
        }
        if (arg === '--changed') {
            const value = args[i + 1];
            if (!value || value.startsWith('--')) {
                io.stderr('--changed requires a <base-ref> argument\n');
                return EXIT_USAGE_ERROR;
            }
            changedBaseRef = value;
            i += 1;
            continue;
        }
        if (arg === '--full') {
            full = true;
            continue;
        }
        if (arg?.startsWith('--')) {
            io.stderr(`Unknown flag: ${arg}\n`);
            return EXIT_USAGE_ERROR;
        }
        if (targetPath !== undefined) {
            io.stderr(`Unexpected extra argument: ${arg}\n`);
            return EXIT_USAGE_ERROR;
        }
        targetPath = arg;
    }
    const rootDir = path.resolve(io.cwd, targetPath ?? '.');
    // Refuse a path that is not a knowledge repo at all (docs/issues/0092): with
    // no records and no `.lore/`, discovery walks nothing, every rule has nothing
    // to say, and "0 records, 0 errors" exits 0 — so a CI gate run from the wrong
    // working directory passes forever. The anchor rule itself lives in
    // `@lore/core` (ADR-0002); this is only the exit code.
    if (!(await isKnowledgeRepoRoot(rootDir))) {
        io.stderr(`lore validate: ${rootDir} is not a knowledge repository — no records under org/, products/ or teams/, and no .lore/ config.\n` +
            'Nothing was validated. Point lore at a knowledge repo root (or pass its path).\n');
        return EXIT_USAGE_ERROR;
    }
    let result;
    try {
        if (changedBaseRef) {
            const changedFiles = await getChangedFiles(rootDir, changedBaseRef);
            result = await validateChanged(rootDir, changedFiles, { full });
        }
        else {
            const full0 = await validateRepo(rootDir);
            result = { ...full0, mode: 'full', escalationReason: null };
        }
    }
    catch (err) {
        io.stderr(`lore validate failed: ${err instanceof Error ? err.message : String(err)}\n`);
        return EXIT_USAGE_ERROR;
    }
    if (format === 'json') {
        io.stdout(`${JSON.stringify(toJsonOutput(result))}\n`);
    }
    else {
        io.stdout(`${formatHuman(result)}\n`);
    }
    return result.summary.errors > 0 ? EXIT_VALIDATION_ERRORS : EXIT_OK;
}
/** Shared flag parsing for `new`/`supersede` — both take the same flag set, differing only in positional shape. */
function parseScaffoldFlags(args, io) {
    const flags = { positional: [], format: 'human' };
    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === '--scope' || arg === '--title' || arg === '--description' || arg === '--repo' || arg === '--format') {
            const value = args[i + 1];
            if (!value || value.startsWith('--')) {
                io.stderr(`${arg} requires a value\n`);
                return undefined;
            }
            if (arg === '--format') {
                if (value !== 'human' && value !== 'json') {
                    io.stderr(`--format must be "human" or "json", got: ${value}\n`);
                    return undefined;
                }
                flags.format = value;
            }
            else if (arg === '--scope') {
                flags.scope = value;
            }
            else if (arg === '--title') {
                flags.title = value;
            }
            else if (arg === '--description') {
                flags.description = value;
            }
            else {
                flags.repo = value;
            }
            i += 1;
            continue;
        }
        if (arg?.startsWith('--')) {
            io.stderr(`Unknown flag: ${arg}\n`);
            return undefined;
        }
        flags.positional.push(arg);
    }
    return flags;
}
function reportScaffoldError(err, format, io, repoRoot) {
    if (err instanceof ScaffoldError) {
        if (format === 'json') {
            io.stderr(`${JSON.stringify(err.diagnostic)}\n`);
        }
        else {
            io.stderr(`ERROR [${err.diagnostic.rule}] ${err.diagnostic.file}${err.diagnostic.pointer}: ${err.diagnostic.message}\n`);
            const hint = scaffoldHint(err, repoRoot);
            if (hint)
                io.stderr(`${hint}\n`);
        }
        return EXIT_USAGE_ERROR;
    }
    io.stderr(`lore failed: ${err instanceof Error ? err.message : String(err)}\n`);
    return EXIT_USAGE_ERROR;
}
/**
 * "Scope directory X does not exist" states the refusal without saying whether
 * a new scope is even allowed — and the setup guide says scopes appear
 * implicitly, so the honest reading is "lore is broken". A new scope is two
 * host-config edits nothing derives: the directory, and a CODEOWNERS line to
 * route its reviews.
 *
 * It renders here rather than in the `@lore/core` diagnostic because an
 * absolute host path is not machine-contract material — and absolute it must
 * be, since under `--repo` the repo root is not the cwd and a relative `mkdir`
 * would create the directory somewhere else, leaving the re-run to fail
 * identically. Human format only; JSON stays the diagnostic, verbatim.
 */
function scaffoldHint(err, repoRoot) {
    if (err.diagnostic.rule !== 'scaffold/unknown-scope')
        return undefined;
    const absolute = path.join(repoRoot, ...err.diagnostic.file.split('/'));
    return `  If that scope is right, create it and route its reviews, then re-run:\n    mkdir -p ${absolute}\n    (and add a CODEOWNERS line for ${err.diagnostic.file}/)`;
}
async function runNew(args, io) {
    const flags = parseScaffoldFlags(args, io);
    if (!flags)
        return EXIT_USAGE_ERROR;
    const [type, ...extra] = flags.positional;
    if (!type) {
        io.stderr(`lore new requires a <type> argument\n${USAGE}`);
        return EXIT_USAGE_ERROR;
    }
    if (extra.length > 0) {
        io.stderr(`Unexpected extra argument: ${extra[0]}\n`);
        return EXIT_USAGE_ERROR;
    }
    if (!flags.scope) {
        io.stderr('lore new requires --scope <org|product:slug|team:slug>\n');
        return EXIT_USAGE_ERROR;
    }
    if (!flags.title) {
        io.stderr('lore new requires --title <title>\n');
        return EXIT_USAGE_ERROR;
    }
    const repoRoot = path.resolve(io.cwd, flags.repo ?? '.');
    let result;
    try {
        result = await scaffoldRecord({
            repoRoot,
            type,
            scope: flags.scope,
            title: flags.title,
            description: flags.description,
            actor: await gitActor(repoRoot),
        });
    }
    catch (err) {
        return reportScaffoldError(err, flags.format, io, repoRoot);
    }
    if (flags.format === 'json') {
        io.stdout(`${JSON.stringify({ file: result.relativePath, id: result.id, slug: result.slug })}\n`);
    }
    else {
        io.stdout(`Wrote ${result.relativePath} (id: ${result.id})\n`);
    }
    return EXIT_OK;
}
async function runSupersede(args, io) {
    const flags = parseScaffoldFlags(args, io);
    if (!flags)
        return EXIT_USAGE_ERROR;
    const [ulid, ...extra] = flags.positional;
    if (!ulid) {
        io.stderr(`lore supersede requires a <ulid> argument\n${USAGE}`);
        return EXIT_USAGE_ERROR;
    }
    if (extra.length > 0) {
        io.stderr(`Unexpected extra argument: ${extra[0]}\n`);
        return EXIT_USAGE_ERROR;
    }
    if (!flags.title) {
        io.stderr('lore supersede requires --title <title>\n');
        return EXIT_USAGE_ERROR;
    }
    const repoRoot = path.resolve(io.cwd, flags.repo ?? '.');
    let result;
    try {
        result = await supersedeRecord({
            repoRoot,
            ulid,
            title: flags.title,
            description: flags.description,
            actor: await gitActor(repoRoot),
        });
    }
    catch (err) {
        return reportScaffoldError(err, flags.format, io, repoRoot);
    }
    if (flags.format === 'json') {
        io.stdout(`${JSON.stringify({
            file: result.relativePath,
            id: result.id,
            slug: result.slug,
            predecessor: result.predecessorPath,
        })}\n`);
    }
    else {
        io.stdout(`Wrote ${result.relativePath} (id: ${result.id}), superseded ${result.predecessorPath}\n`);
    }
    return EXIT_OK;
}
/** `--scopes`/`--identity` are repeatable AND accept a comma-separated list per occurrence (docs/issues/0111). */
function parseInitFlags(args, io) {
    const flags = { positional: [], scopes: [], identities: [], format: 'human' };
    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === '--scopes' || arg === '--identity' || arg === '--format') {
            const value = args[i + 1];
            if (!value || value.startsWith('--')) {
                io.stderr(`${arg} requires a value\n`);
                return undefined;
            }
            if (arg === '--format') {
                if (value !== 'human' && value !== 'json') {
                    io.stderr(`--format must be "human" or "json", got: ${value}\n`);
                    return undefined;
                }
                flags.format = value;
            }
            else if (arg === '--scopes') {
                flags.scopes.push(...value.split(',').map((s) => s.trim()).filter(Boolean));
            }
            else {
                for (const entry of value.split(',').map((s) => s.trim()).filter(Boolean)) {
                    const eq = entry.indexOf('=');
                    if (eq <= 0 || eq === entry.length - 1) {
                        io.stderr(`--identity entries must be "handle=corporate-identity": got "${entry}"\n`);
                        return undefined;
                    }
                    flags.identities.push({ handle: entry.slice(0, eq), identity: entry.slice(eq + 1) });
                }
            }
            i += 1;
            continue;
        }
        if (arg?.startsWith('--')) {
            io.stderr(`Unknown flag: ${arg}\n`);
            return undefined;
        }
        flags.positional.push(arg);
    }
    return flags;
}
async function runInit(args, io) {
    const flags = parseInitFlags(args, io);
    if (!flags)
        return EXIT_USAGE_ERROR;
    const [targetArg, ...extra] = flags.positional;
    if (!targetArg) {
        io.stderr(`lore init requires a <dir> argument\n${USAGE}`);
        return EXIT_USAGE_ERROR;
    }
    if (extra.length > 0) {
        io.stderr(`Unexpected extra argument: ${extra[0]}\n`);
        return EXIT_USAGE_ERROR;
    }
    const targetDir = path.resolve(io.cwd, targetArg);
    let result;
    try {
        result = await initRepo({ targetDir, scopes: flags.scopes, identities: flags.identities });
    }
    catch (err) {
        if (err instanceof InitPostconditionError) {
            if (flags.format === 'json') {
                io.stderr(`${JSON.stringify({ rule: 'scaffold/postcondition-failed', diagnostics: err.diagnostics })}\n`);
            }
            else {
                io.stderr('lore init produced an invalid tree and wrote nothing. Diagnostics:\n');
                for (const diagnostic of err.diagnostics)
                    io.stderr(`${formatDiagnosticLine(diagnostic)}\n`);
            }
            return EXIT_VALIDATION_ERRORS;
        }
        return reportScaffoldError(err, flags.format, io, targetDir);
    }
    if (flags.format === 'json') {
        io.stdout(`${JSON.stringify({
            targetDir: result.targetDir,
            scopes: result.scopes,
            summary: result.validation.summary,
        })}\n`);
    }
    else {
        io.stdout(`Wrote canonical repo scaffold to ${result.targetDir}\n` +
            `  scopes: ${result.scopes.join(', ')}\n` +
            `  validated: ${result.validation.summary.errors} errors, ${result.validation.summary.warnings} warnings, ${result.validation.summary.files} files\n\n` +
            'Next steps:\n' +
            `  cd ${result.targetDir}\n` +
            '  git init -b main && git add -A && git commit -m "seed from lore init"\n' +
            '  git remote add origin <your-remote-url> && git push -u origin main\n');
    }
    return EXIT_OK;
}
//# sourceMappingURL=main.js.map