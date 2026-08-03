// Shared process helpers for the ops scripts (install-smoke, try-lore,
// release-images) — extracted so "run a command, report failure" and the
// readiness poll exist once instead of drifting per-script.
import { spawn, spawnSync } from 'node:child_process';

/** How much of a step's stderr `runTee` keeps for its failure tail. */
const STDERR_KEEP_BYTES = 8192;

/** Streams a command (stdio inherit), logging the invocation; returns the exit status. Throws only on spawn failure. */
export function run(cmd, args, { log = console.log, ...opts } = {}) {
  log(`$ ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (result.error) throw result.error;
  return result.status ?? 0;
}

/**
 * Streams a command like `run`, but tees stderr into a bounded buffer so a
 * failing step can quote its own output tail (docs/issues/0097) without
 * hiding progress while it runs. Resolves `{ status, stderr }`.
 */
export function runTee(cmd, args, { log = console.log, ...opts } = {}) {
  log(`$ ${cmd} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { ...opts, stdio: ['inherit', 'inherit', 'pipe'] });
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
      stderr = (stderr + chunk).slice(-STDERR_KEEP_BYTES);
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ status: code ?? 0, stderr }));
  });
}

/** Captures a command's output; never throws on nonzero exit — callers inspect `status`. */
export function runCapture(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  return { status: result.status ?? 0, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

/** Runs git in `dir`, throwing with stderr on failure; returns stdout. */
export function git(dir, ...args) {
  const result = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  return result.stdout;
}

/** Both the daemon and the compose plugin must answer. */
export function checkDockerAvailable(cwd) {
  const version = runCapture('docker', ['version', '--format', '{{.Server.Version}}'], { cwd });
  if (version.status !== 0) return false;
  return runCapture('docker', ['compose', 'version'], { cwd }).status === 0;
}

/** Polls `url` every second until it answers 200 (returns true) or the deadline passes (throws the last error). */
export async function waitForReady(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastErr;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return true;
      lastErr = new Error(`${url} responded ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw lastErr ?? new Error(`timed out waiting for ${url}`);
}
