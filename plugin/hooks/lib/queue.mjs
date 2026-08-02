/**
 * The one parser/writer for `${LORE_HOME:-~/.lore}/capture-queue.jsonl` —
 * shared by enqueue-capture.mjs (dedupe check), render-pending.mjs
 * (notification), and drain-queue.mjs (lifecycle transitions,
 * docs/issues/0057). Skips blank and malformed lines rather than failing:
 * the hook callers are failure-silent.
 *
 * Entry lifecycle (docs/issues/0057): `queued` → `draining` → `done`,
 * with `fail` sending an entry back to `queued` until MAX_ATTEMPTS, then
 * `parked`. Entries written before 0057 carry no status; normalizeEntry
 * treats them as freshly queued.
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

export const MAX_ATTEMPTS = 3;
export const DRAIN_BATCH_SIZE = 3;
export const STALE_CLAIM_MS = 30 * 60 * 1000;
/**
 * How long terminal entries (`done` and `parked`) are kept. Parked entries
 * age out too — an unrecoverable park (e.g. "transcript missing") must not
 * nag every session start forever (docs/issues/0124).
 */
export const TERMINAL_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
/**
 * How long a `Stop`-enqueued entry must sit untouched before it may be
 * drained. Codex fires Stop per turn while the session is still live
 * (docs/issues/0054), so draining on sight would capture a partial
 * transcript and the dedupe record would block a later full capture; a
 * quiet period plus the per-turn ts refresh in enqueue-capture.mjs means
 * "no activity for 10 minutes", a decent end-of-session proxy. SessionEnd
 * entries are definitively over and are eligible immediately.
 */
export const DRAIN_QUIET_MS = 10 * 60 * 1000;
/** Max records the org brief carries (docs/issues/0059) — enforced on write AND on read. */
export const BRIEF_CAP = 10;

export function loreHome() {
  return process.env.LORE_HOME || path.join(homedir(), '.lore');
}

export function queuePathIn(home) {
  return path.join(home, 'capture-queue.jsonl');
}

export function lockPathIn(home) {
  return path.join(home, 'capture-drain.lock');
}

export function briefPathIn(home) {
  return path.join(home, 'org-brief.json');
}

/**
 * Capture pause marker (the capture-pause skill): while this file exists,
 * enqueue-capture records nothing (a paused session is skipped, never
 * deferred), drain-queue hands out no claims, and render-pending announces
 * the pause instead of instructing a drain. The marker is the whole
 * mechanism — `touch` to pause, `rm` to resume — so the paused state
 * survives restarts and needs no network or API.
 */
export function pausePathIn(home) {
  return path.join(home, 'capture-paused');
}

function normalizeEntry(entry) {
  return {
    ...entry,
    status: entry.status ?? 'queued',
    attempts: typeof entry.attempts === 'number' ? entry.attempts : 0,
  };
}

export function readQueue(queuePath) {
  if (!existsSync(queuePath)) return [];
  const raw = readFileSync(queuePath, 'utf8');
  const entries = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(normalizeEntry(JSON.parse(trimmed)));
    } catch {
      // Skip a malformed line rather than fail the caller.
    }
  }
  return entries;
}

/**
 * Atomic replace (tmp + rename) so a concurrent reader never sees a torn
 * file. Known, accepted gap: an enqueue APPEND that lands between a
 * rewriter's read and this rename is lost — a sub-millisecond window on a
 * single-user machine, and closing it would need a lock enqueue-capture
 * also honors, which would put blocking work in a session-close hook.
 */
export function writeQueue(queuePath, entries) {
  const body = entries.map((e) => JSON.stringify(e)).join('\n');
  atomicReplace(queuePath, body ? body + '\n' : '');
}

/** The tmp+rename primitive behind writeQueue, shared with pending-proposals.mjs. */
export function atomicReplace(filePath, body) {
  const tmpPath = `${filePath}.tmp`;
  writeFileSync(tmpPath, body, 'utf8');
  renameSync(tmpPath, filePath);
}

export function entryTime(entry) {
  const t = new Date(entry.ts ?? 0).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * The one freshness predicate for claim/lock timestamps: a missing,
 * invalid, or FUTURE timestamp is never fresh (forward clock skew must
 * not wedge a claim or a lock past every recovery path).
 */
export function isFresh(ts, now) {
  if (typeof ts !== 'string') return false;
  const age = now - new Date(ts).getTime();
  return Number.isFinite(age) && age >= 0 && age < STALE_CLAIM_MS;
}

/**
 * Is this a terminal entry (`done`/`parked`) past its retention window?
 * Age counts from `ts`, which every transition into a terminal state
 * restamps — retention starts at completion/parking, not enqueue.
 */
export function terminalExpired(entry, now) {
  return (
    (entry.status === 'done' || entry.status === 'parked') &&
    now - entryTime(entry) >= TERMINAL_RETENTION_MS
  );
}

/**
 * The one "this capture can never drain" rule: no librarian run can succeed
 * without a readable transcript (docs/issues/0124).
 */
export function transcriptMissing(transcriptPath) {
  return !transcriptPath || !existsSync(transcriptPath);
}

/** May this entry be handed to a librarian run right now? */
export function drainEligible(entry, now) {
  if (entry.status !== 'queued') return false;
  if (entry.event === 'SessionEnd') return true;
  return now - entryTime(entry) >= DRAIN_QUIET_MS;
}

/**
 * A drain lock is held while any session is running the librarian over
 * claimed entries. Stale locks (crashed drains) are taken over.
 */
export function readLock(lockPath) {
  if (!existsSync(lockPath)) return null;
  try {
    const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
    return typeof lock === 'object' && lock !== null ? lock : null;
  } catch {
    return null;
  }
}

export function lockIsFresh(lock, now) {
  return lock !== null && isFresh(lock.ts, now);
}
