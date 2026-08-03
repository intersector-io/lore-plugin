/**
 * The shared imperative shell of the lore quickstart — everything both
 * wrappers do identically: seed a git working tree from the demo seed, write
 * the run's env files, drive the named compose steps, wait for the API and
 * print the summary. The two wrappers differ only in configuration:
 *
 * - scripts/try-lore.mjs (C3): monorepo checkout, builds the images from
 *   source, scratch under `.tmp/`, random per-run namespace.
 * - ops/deploy-bundle/try-lore.mjs (docs/issues/0127): the public mirror's
 *   deploy bundle, pulls the licensed images from the registry, scratch under
 *   `.try/`, pinned `lore-try` namespace.
 *
 * Pure helpers (namespace, env contents, step list, failure attribution) live
 * in quickstart.mjs so root `npm test` covers them without a container.
 */
import { randomBytes } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { checkDockerAvailable as dockerAvailable, git, runCapture, runTee, waitForReady } from './proc.mjs';
import {
  composeEnvFileContents,
  composePrefix,
  composeRunEnv,
  demoEnvFileContents,
  deriveRunNamespace,
  formatElapsed,
  parseQuickstartArgs,
  quickstartSteps,
  stepFailureMessage,
  teardownCommand,
} from './quickstart.mjs';

const log = (msg) => console.log(`[try-lore] ${msg}`);
const warn = (msg) => console.warn(`[try-lore] WARNING: ${msg}`);

/** guided-demo Part 1 step 1: a real git working tree seeded from `<root>/demo`. */
function seedDemoRepo(root, demoDst, reuse) {
  if (existsSync(demoDst)) {
    if (reuse) {
      log(`reusing existing ${path.relative(root, demoDst)} (--reuse)`);
      return;
    }
    log(`removing existing ${path.relative(root, demoDst)} for a fresh copy`);
    rmSync(demoDst, { recursive: true, force: true });
  }
  mkdirSync(path.dirname(demoDst), { recursive: true });
  log(`copying demo/ → ${path.relative(root, demoDst)}`);
  cpSync(path.join(root, 'demo'), demoDst, { recursive: true });
  git(demoDst, 'init', '-q', '-b', 'main');
  // core.autocrlf=input keeps Linux git in the container from seeing every CRLF
  // file as unstaged (guided-demo.md Part 1 — matters on Windows, harmless else).
  git(demoDst, 'config', 'core.autocrlf', 'input');
  git(demoDst, 'add', '-A');
  git(demoDst, '-c', 'user.name=demo', '-c', 'user.email=demo@localhost', 'commit', '-qm', 'demo seed');
  log('demo seed committed');
}

/** guided-demo Part 1 steps 2 + 3: the API env file and this run's compose env file. */
function writeEnvFiles(root, ns, image) {
  const secret = randomBytes(32).toString('hex');
  writeFileSync(path.join(root, ns.apiEnvFile), demoEnvFileContents(secret), 'utf8');
  log(`wrote ${ns.apiEnvFile} (fresh webhook secret)`);
  writeFileSync(path.join(root, ns.composeEnvFile), composeEnvFileContents(ns, image), 'utf8');
  log(`wrote ${ns.composeEnvFile} (compose pointers — no shared .env is touched)`);
}

/**
 * Runs the whole quickstart. `config`:
 * - `root`      — the directory the compose file and the `demo/` seed live
 *                 in; every path and compose invocation is relative to it.
 * - `image`     — { registry, tag? } to PULL the licensed images (the deploy
 *                 bundle), undefined to build them from source (the monorepo).
 * - `project`   — pinned default compose project, or undefined for a random
 *                 per-run namespace (`--project` always overrides).
 * - `scratchDir`— where the run's checkout and env files land.
 * Sets process.exitCode and returns; never throws on expected failures.
 */
export async function runQuickstart(argv, config) {
  const { root, image, project, scratchDir = '.tmp' } = config;

  let opts;
  let ns;
  try {
    opts = parseQuickstartArgs(argv);
    const composeProject = opts.project ?? project;
    if (opts.reuse && composeProject === undefined) {
      warn('--reuse without --project: this run gets a fresh namespace, so there is nothing to reuse');
    }
    // A random token by default, so two runs on one machine never share a
    // project, a volume or a port; --project (or a wrapper-pinned default)
    // pins the whole namespace instead.
    ns = deriveRunNamespace({
      project: composeProject,
      port: opts.port,
      token: randomBytes(3).toString('hex'),
      scratchDir,
    });
  } catch (err) {
    console.error(`[try-lore] ${err.message}`);
    process.exitCode = 2;
    return;
  }

  if (!dockerAvailable(root)) {
    console.error(
      '[try-lore] Docker (or the docker compose plugin) is not available.\n' +
        '[try-lore] Install Docker Desktop (or start the Docker engine) and re-run the quickstart.',
    );
    process.exitCode = 1;
    return;
  }
  if (runCapture('git', ['--version'], { cwd: root }).status !== 0) {
    console.error(
      '[try-lore] git is not available — the demo seed must be a real git working tree.\n' +
        '[try-lore] Install git (≥ 2.28) and re-run the quickstart.',
    );
    process.exitCode = 1;
    return;
  }

  const startedAt = Date.now();

  log(`compose project ${ns.project} — API on :${ns.apiPort}, database on :${ns.dbPort}`);
  seedDemoRepo(root, path.join(root, ns.demoDir), opts.reuse);
  writeEnvFiles(root, ns, image);

  // Compose reads the shell environment ahead of --env-file, so the child env
  // is hermetic: every LORE_* is scrubbed, then this run's values (the same
  // composeRunEnv the env file serializes) are pinned. A stale exported
  // LORE_* — a port, a db password, an indexer env file from a real install —
  // can then neither redirect the stack nor shadow a compose default.
  // Deliberate overrides (LORE_IMAGE_REGISTRY/TAG) survive because the
  // wrapper read them into `image` before this point.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('LORE_')));
  Object.assign(env, composeRunEnv(ns, image));

  // reset → build/pull → db → migrate → rebuild → api. Streamed so the
  // rebuild's JSON summary stays visible, teed so a failing step can quote
  // its own tail.
  for (const step of quickstartSteps(ns, { image, reuse: opts.reuse })) {
    log(`step: ${step.name}`);
    const result = await runTee(step.cmd, step.args, { cwd: root, env, log });
    if (result.status !== 0) return fail(stepFailureMessage(step, result), ns);
  }

  const baseUrl = `http://localhost:${ns.apiPort}`;
  log(`step: wait for the API at ${baseUrl}/ready`);
  try {
    await waitForReady(`${baseUrl}/ready`, 120_000);
  } catch (err) {
    return fail(`FAILED at step "wait for the API": ${err.message}`, ns);
  }

  const elapsed = formatElapsed(Date.now() - startedAt);

  console.log('');
  log('lore is up over the demo seed.');
  console.log('');
  console.log(`  Portal:  ${baseUrl}/portal/`);
  console.log(`  Docs:    ${baseUrl}/docs/`);
  console.log('');
  console.log('  Register the first account in the portal — the first user becomes the admin.');
  console.log('');
  console.log(`  time to first search: ${elapsed}`);
  console.log('');
  console.log(`  This run's stack is compose project ${ns.project}. Reach it with:`);
  console.log(`      ${composePrefix(ns)} <command>`);
  console.log('');
  console.log(`  Tear it down with:  ${teardownCommand(ns)}`);
  console.log('');
}

function fail(msg, ns) {
  console.error(`[try-lore] ${msg}`);
  console.error(`[try-lore] clean up this run with:  ${teardownCommand(ns)}`);
  process.exitCode = 1;
}
