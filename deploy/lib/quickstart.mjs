/**
 * Pure helpers for the two quickstart wrappers — scripts/try-lore.mjs (C3,
 * build-from-source) and ops/deploy-bundle/try-lore.mjs (pull licensed images,
 * docs/issues/0127). No I/O, no Docker, no clock: everything here is a pure
 * function so root `npm test` can exercise the run namespace, the env-file
 * assembly, the step list and its failure attribution without touching a
 * container. The shared imperative shell (copy demo/, git init, compose up,
 * readiness probe) lives in quickstart-run.mjs.
 */

/** Compose project names: lowercase alphanumeric start, then `-`/`_`/alnum. */
const PROJECT_NAME = /^[a-z0-9][a-z0-9_-]*$/;

/** Port offsets are 1..PORT_SPAN, so a run never lands on the shared defaults. */
const PORT_SPAN = 499;
const DEFAULT_API_PORT = 3300;
const DEFAULT_DB_PORT = 55432;

/** How many lines of a failed step's output the failure message repeats. */
const FAILURE_TAIL_LINES = 20;

/**
 * The API env file the quickstart writes to `<demoDir>.env` — byte-for-byte
 * what guided-demo.md Part 1 step 2 documents (local auth, local git provider,
 * fake embeddings). `webhookSecret` comes from node crypto in the wrapper (no
 * openssl dependency), so it's injected rather than generated here.
 */
export function demoEnvFileContents(webhookSecret) {
  return (
    [
      'LORE_REPO_PATH=/repo',
      'LORE_AUTH_MODE=local',
      'LORE_GIT_PROVIDER=local',
      `LORE_WEBHOOK_SECRET=${webhookSecret}`,
      'LORE_EMBEDDING_PROVIDER=fake:default',
    ].join('\n') + '\n'
  );
}

/** `npm run try -- [--reuse] [--project <name>] [--port <n>]`. Throws on anything else. */
export function parseQuickstartArgs(argv) {
  const opts = { reuse: false, project: undefined, port: undefined };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--reuse') {
      opts.reuse = true;
      continue;
    }
    const eq = arg.indexOf('=');
    const flag = eq === -1 ? arg : arg.slice(0, eq);
    if (flag !== '--project' && flag !== '--port') {
      throw new Error(`unknown option ${arg} (usage: npm run try -- [--reuse] [--project <name>] [--port <n>])`);
    }
    let value = arg.slice(eq + 1);
    if (eq === -1) {
      i += 1;
      value = argv[i];
    }
    if (value === undefined || value === '') throw new Error(`${flag} needs a value`);
    if (flag === '--project') {
      opts.project = value;
    } else {
      const port = Number(value);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`--port must be a port number, got ${value}`);
      }
      opts.port = port;
    }
  }

  return opts;
}

/** FNV-1a, so a pinned project name always derives the same ports. */
function hashString(value) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Everything one quickstart run owns, so two runs (or a run alongside the
 * dev stack) never share a compose project, a volume, a published port, or a
 * scratch file. Derived entirely from the project name — pin it with
 * `--project` and the same namespace comes back, which is what makes `--reuse`
 * and the printed teardown line work. Paths are relative to the wrapper's
 * working directory; `scratchDir` is `.tmp` for the monorepo wrapper and
 * `.try` for the deploy bundle (whose `./repo` is a real install's checkout).
 */
export function deriveRunNamespace({ project, port, token = 'default', scratchDir = '.tmp' } = {}) {
  const name = project ?? `lore-try-${token}`;
  if (!PROJECT_NAME.test(name)) {
    throw new Error(`invalid compose project name "${name}" — use lowercase letters, digits, "-" and "_"`);
  }
  // `lore` is the compose files' own `name:` — the default project of a REAL
  // install. Adopting it would recreate that install's services over the demo
  // env and hand the user a teardown line that deletes its volumes.
  if (name === 'lore') {
    throw new Error('--project lore is refused: that is a real install\'s default compose project, and this run\'s teardown would destroy it');
  }
  const offset = 1 + (hashString(name) % PORT_SPAN);
  return {
    project: name,
    apiPort: port ?? DEFAULT_API_PORT + offset,
    dbPort: DEFAULT_DB_PORT + offset,
    demoDir: `${scratchDir}/${name}`,
    apiEnvFile: `${scratchDir}/${name}.env`,
    composeEnvFile: `${scratchDir}/${name}.compose.env`,
  };
}

/**
 * The `${LORE_*}` values this run pins, as one plain object — the single
 * source both consumers derive from: the scratch compose env file, and the
 * child-process env (the runner scrubs every other LORE_* from it, so vars
 * this object does NOT pin — db credentials, indexer env file — fall through
 * to the compose file's own defaults rather than a stale shell export).
 * LORE_REMOTE_HOST_PATH is pinned to the seed checkout although nothing reads
 * /remote here: unpinned, the compose default would bind-mount `./repo` and
 * the docker engine would create it root-owned in a pristine bundle dir.
 * `image` ({ registry, tag? }) is the deploy-bundle variant's extra pair —
 * its compose file pulls `${LORE_IMAGE_REGISTRY}/lore-*:${LORE_IMAGE_TAG}`
 * instead of building. An unset tag is deliberately omitted so the compose
 * file's own `:-latest` default stays the only statement of the moving tag.
 */
export function composeRunEnv(ns, image) {
  return {
    LORE_REPO_HOST_PATH: `./${ns.demoDir}`,
    LORE_REMOTE_HOST_PATH: `./${ns.demoDir}`,
    LORE_API_ENV_FILE: ns.apiEnvFile,
    LORE_API_PORT: String(ns.apiPort),
    LORE_DB_PORT: String(ns.dbPort),
    ...(image
      ? { LORE_IMAGE_REGISTRY: image.registry, ...(image.tag ? { LORE_IMAGE_TAG: image.tag } : {}) }
      : {}),
  };
}

/**
 * The scratch compose env file — composeRunEnv serialized. Written under the
 * scratch dir, never a shared `.env`: the quickstart must not mutate state a
 * real stack also reads.
 */
export function composeEnvFileContents(ns, image) {
  return (
    [
      `# generated by the lore quickstart for compose project ${ns.project} — safe to delete`,
      ...Object.entries(composeRunEnv(ns, image)).map(([key, value]) => `${key}=${value}`),
    ].join('\n') + '\n'
  );
}

/**
 * guided-demo Part 1 step 4, one named step per command. Acquiring the images
 * is its own step on purpose: folded into `migrate`, a failed build sent
 * evaluators to debug the wrong subsystem (docs/issues/0097). `image` present
 * means the deploy-bundle variant: pull from the licensed registry instead of
 * building (its compose file has no build context at all), and carry the
 * `docker login` hint on the step itself — a failed pull is usually the
 * licensing boundary, not a broken stack, and stepFailureMessage renders it.
 * The pull covers `db` too: an evaluator whose network reaches the licensed
 * registry but not Docker Hub must fail HERE, not at "start the database".
 *
 * A fresh (non-`--reuse`) run starts by tearing its own project down,
 * volumes included: a pinned project (the deploy bundle's `lore-try`) would
 * otherwise re-seed the checkout while Postgres, local users and the local
 * proposal registry survive on the previous run's volumes — a stale index
 * over a brand-new git history, and "the first user becomes the admin"
 * would be false on every second run.
 */
export function quickstartSteps(ns, { image, reuse = false } = {}) {
  const compose = (...args) => ({
    cmd: 'docker',
    args: ['compose', '-p', ns.project, '--env-file', ns.composeEnvFile, ...args],
  });
  const acquireImages = image
    ? { name: 'pull images', ...compose('--profile', 'indexer', 'pull', 'db', 'api', 'indexer') }
    : { name: 'build images', ...compose('--profile', 'indexer', 'build', 'api', 'indexer') };
  if (image) {
    acquireImages.hint = [
      'Pulling the images needs your licensed registry credential:',
      `  docker login ${image.registry.split('/')[0]} -u <your-customer-username> -p <your-pull-token>`,
      'See README.md in the deploy bundle.',
    ];
  }
  return [
    ...(reuse ? [] : [{ name: 'reset any previous run', ...compose('down', '-v', '--remove-orphans') }]),
    acquireImages,
    { name: 'start the database', ...compose('up', '-d', '--wait', 'db') },
    { name: 'migrate the database', ...compose('--profile', 'indexer', 'run', '--rm', 'indexer', 'migrate') },
    { name: 'index the demo seed', ...compose('--profile', 'indexer', 'run', '--rm', 'indexer', 'rebuild', '--ref', 'main') },
    { name: 'start the API', ...compose('up', '-d', 'api') },
  ];
}

/** The last `count` lines of captured output, without a trailing blank. */
export function tailLines(text, count) {
  const trimmed = text.replace(/\n+$/, '');
  if (trimmed === '') return '';
  return trimmed.split('\n').slice(-count).join('\n');
}

/** Attributes a failure to the step that produced it, with that step's own output tail and hint. */
export function stepFailureMessage(step, { status, stderr = '' }) {
  const tail = tailLines(stderr, FAILURE_TAIL_LINES);
  const lines = [`FAILED at step "${step.name}": ${step.cmd} ${step.args.join(' ')} exited ${status}`];
  if (tail !== '') lines.push(`--- last output from "${step.name}" ---`, tail);
  if (step.hint) lines.push(...step.hint);
  return lines.join('\n');
}

/**
 * How a human reaches this run's stack from their own shell — every compose
 * command against it (rebuild, restart, logs, down) starts with this prefix,
 * because the run deliberately left the repo-root `.env` alone.
 */
export function composePrefix(ns) {
  return `docker compose -p ${ns.project} --env-file ${ns.composeEnvFile}`;
}

/** The teardown for exactly this run — same project, same scratch files. */
export function teardownCommand(ns) {
  return `${composePrefix(ns)} down -v && rm -rf ${ns.demoDir} ${ns.apiEnvFile} ${ns.composeEnvFile}`;
}

/** Whole seconds, e.g. 8123 → "8s" — the measured time-to-first-search metric. */
export function formatElapsed(ms) {
  return `${Math.round(ms / 1000)}s`;
}
