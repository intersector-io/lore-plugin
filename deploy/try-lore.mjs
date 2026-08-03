#!/usr/bin/env node
/**
 * Quick try over the licensed registry images (docs/issues/0127) — no monorepo
 * required. Run from the `deploy/` directory of the public
 * `intersector-io/lore-plugin` mirror, after `docker login` with your
 * per-customer registry credential:
 *
 *   node try-lore.mjs
 *
 * It seeds a git working tree from the bundled `demo/` seed, writes local-auth
 * env files under `.try/`, PULLS the lore-api/lore-indexer images (never
 * builds — this bundle has no source), brings the stack up (db → migrate →
 * rebuild → api) and prints the portal/docs URLs plus the measured
 * time-to-first-search. Isolated from a real install in the same directory:
 * everything lives in the pinned `lore-try` compose project and `.try/` —
 * `./repo`, `env/*.env` and any `.env` beside the compose file are never read
 * or written. `--project`/`--port` re-pin the namespace, `--reuse` keeps an
 * existing checkout; the printed teardown line removes the run completely.
 *
 * LORE_IMAGE_REGISTRY overrides the image prefix; LORE_IMAGE_TAG pins a tag
 * (unset, the compose file's own `latest` default applies).
 *
 * In the mirror, `lib/` and `demo/` beside this file are assembled by the
 * mirror sync from the product monorepo (scripts/sync-plugin-mirror.mjs), so
 * in the monorepo itself this file's import doesn't resolve — use
 * `npm run try` there instead.
 */
import { existsSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runQuickstart } from './lib/quickstart-run.mjs';

const bundleRoot = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_IMAGE_REGISTRY = 'registry.gitlab.com/intersector-io/lore';

export async function main() {
  if (!existsSync(path.join(bundleRoot, 'demo'))) {
    console.error(
      '[try-lore] demo/ is missing beside this script.\n' +
        '[try-lore] Run this from the deploy/ directory of the intersector-io/lore-plugin mirror.',
    );
    process.exitCode = 1;
    return;
  }

  await runQuickstart(process.argv.slice(2), {
    root: bundleRoot,
    image: {
      registry: process.env.LORE_IMAGE_REGISTRY || DEFAULT_IMAGE_REGISTRY,
      // Unset stays unset: the compose file's `:-latest` default is the only
      // statement of the moving tag (scripts/lib/image-refs.mjs pins it).
      tag: process.env.LORE_IMAGE_TAG || undefined,
    },
    // Pinned: the bundle directory is the isolation unit, and a stable name is
    // what makes --reuse and the printed teardown line work with no flags.
    project: 'lore-try',
    // Never `.tmp` — and never `./repo`, which is a real install's canon
    // checkout. Everything this run touches lives under `.try/`.
    scratchDir: '.try',
  });
}

// Guarded so the mirror structure test can import this module (proving the
// assembled lib/ resolves) without standing a stack up. Both sides go through
// realpath: Node resolves the main module's symlinks (and on-disk case, on
// Windows) into import.meta.url, so comparing against the argv path as typed
// would silently no-op behind a symlink — the worst failure shape here.
const invokedDirectly = (() => {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(path.resolve(process.argv[1]))).href;
  } catch {
    return false;
  }
})();
if (invokedDirectly) {
  main().catch((err) => {
    console.error('[try-lore] fatal:', err);
    process.exitCode = 1;
  });
}
