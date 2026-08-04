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
import { existsSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

export const MAX_ATTEMPTS = 3;
export const DRAIN_BATCH_SIZE = 3;
export const STALE_CLAIM_MS = 30 * 60 * 1000;
/**
 * How long the queue mutex may be held before a caller presumes the holder
 * died and takes the lock from it. A hold is one read + one rename — single
 * digit milliseconds — so this is sized entirely for the other failure mode:
 * a holder starved by a busy machine looks identical to a crashed one, and
 * guessing "crashed" too early puts two writers in the critical section,
 * which is the exact corruption the mutex exists to prevent. Five minutes is
 * four orders of magnitude over a real hold; the only cost of overshooting is
 * that a hard crash mid-write blocks captures until the next session start
 * (docs/issues/0136).
 */
export const QUEUE_MUTEX_STALE_MS = 5 * 60 * 1000;
/**
 * How long an agent-facing command waits for the mutex before giving up. A
 * hold is milliseconds, so this is ~1000x headroom; standing down early is
 * cheap (the work is picked up at the next session start) while making an
 * agent sit on a lock is not.
 */
export const QUEUE_MUTEX_WAIT_MS = 2 * 1000;
/**
 * The session-close hook's much shorter budget: it must never delay session
 * close, so it falls back to an unlocked append rather than keep waiting.
 */
export const QUEUE_MUTEX_HOOK_WAIT_MS = 500;
/** How long atomicReplace keeps retrying a rename another process is blocking. */
export const RENAME_RETRY_MS = 200;
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

/**
 * The queue mutex, distinct from the drain lease above (docs/issues/0136).
 * The lease says "one drain at a time" and is held for the whole librarian
 * run (minutes); this says "one writer at a time" and is held for one
 * read-modify-write (milliseconds). Conflating them was the bug: the lease
 * was *checked* and then *written*, so simultaneous claims from several
 * terminals all read "no lease", all selected the same batch, and all ran
 * the librarian over the same transcripts.
 */
export function mutexPathIn(home) {
  return path.join(home, 'capture-queue.lock');
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

/**
 * Tolerant JSONL reader shared by the queue and the recurrence log
 * (docs/issues/0126): skips blank and malformed lines rather than failing —
 * hook callers are failure-silent, and agent-facing callers degrade to
 * "fewer entries" instead of a dead command.
 */
export function readJsonl(filePath) {
  if (!existsSync(filePath)) return [];
  const entries = [];
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(JSON.parse(trimmed));
    } catch {
      // Skip a malformed line rather than fail the caller.
    }
  }
  return entries;
}

export function readQueue(queuePath) {
  return readJsonl(queuePath).map(normalizeEntry);
}

/**
 * Atomic replace (tmp + rename) so a concurrent reader never sees a torn
 * file. Every read-modify-write of the queue must additionally run inside
 * withQueueLock — rename alone makes writes atomic, not serialized, so
 * without the mutex the later rename silently drops the earlier writer's
 * changes (docs/issues/0136).
 */
export function writeQueue(queuePath, entries) {
  const body = entries.map((e) => JSON.stringify(e)).join('\n');
  atomicReplace(queuePath, body ? body + '\n' : '');
}

/** Block this thread without spinning — every wait here is milliseconds long. */
function pauseSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Windows reports contention on a path several ways — a file open in another
 * process, a delete still pending, a virus scanner holding a handle — none of
 * them EEXIST. Treating only EEXIST as "someone else has it" crashed the
 * caller outright on Windows, which is where the plugin's users are
 * (docs/issues/0136).
 */
const CONTENDED = new Set(['EEXIST', 'EPERM', 'EACCES', 'EBUSY']);

function isContention(err) {
  return CONTENDED.has(err?.code);
}

/**
 * The tmp+rename primitive behind writeQueue, shared with
 * pending-proposals.mjs. Two hardenings over a bare rename
 * (docs/issues/0136):
 *
 * - The scratch name carries the pid. A shared `<file>.tmp` let two
 *   concurrent writers write the same scratch file and rename it twice,
 *   losing or truncating the queue outright. The pid alone is enough — calls
 *   here are synchronous, so one process is never mid-replace twice on the
 *   same file — and it keeps a crash between the write and the rename to at
 *   most one orphan per file, the way the shared name did.
 * - The rename is retried briefly. On Windows it fails with EPERM whenever
 *   anything else holds the destination open — a reader that takes no lock,
 *   an indexer, a scanner — and dropping the whole write on a transient
 *   handle would lose captures.
 */
export function atomicReplace(filePath, body) {
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  writeFileSync(tmpPath, body, 'utf8');
  const deadline = Date.now() + RENAME_RETRY_MS;
  for (;;) {
    try {
      renameSync(tmpPath, filePath);
      return;
    } catch (err) {
      if (!isContention(err) || Date.now() >= deadline) {
        rmSync(tmpPath, { force: true });
        throw err;
      }
      pauseSync(10);
    }
  }
}

/**
 * Freshness of the mutex file, read from its mtime rather than its contents:
 * `writeFileSync` with `wx` creates then writes, so a competitor can observe
 * a zero-byte file mid-create and must not read that as "corrupt, steal it".
 *
 * A slightly FUTURE mtime means alive, not dead. Filesystem timestamps and
 * `Date.now()` are different clocks — on NTFS a file created microseconds ago
 * routinely reports an mtime a few milliseconds ahead — and reading that as
 * "the holder died" deleted a live holder's lock and let a second process
 * into the critical section, which is the exact failure the mutex exists to
 * prevent (docs/issues/0136). Only an implausibly future stamp counts as
 * dead, so real clock skew still can't wedge the queue forever.
 */
function mutexHolderAlive(lockPath, now) {
  let mtimeMs;
  try {
    mtimeMs = statSync(lockPath).mtimeMs;
  } catch (err) {
    // Only an absent lock has no holder. Any other stat failure — EPERM from
    // a scanner holding the handle, EBUSY under load — is uncertainty, and
    // stealing on uncertainty is what breaks mutual exclusion. Assume alive
    // and wait; a genuinely dead holder is reaped on a later pass.
    return err?.code !== 'ENOENT';
  }
  const age = now - mtimeMs;
  return age < QUEUE_MUTEX_STALE_MS && age > -QUEUE_MUTEX_STALE_MS;
}

/**
 * Run `fn` as the only writer of `lockPath`'s file (docs/issues/0136).
 * Acquisition is `writeFileSync(..., {flag:'wx'})` — O_CREAT|O_EXCL on POSIX,
 * CREATE_NEW on Windows — so exactly one of any number of simultaneous
 * callers wins; check-then-write can't express that. A lock whose holder died
 * is unlinked and re-contended for (never taken directly, or two stealers
 * would both enter). Returns `{locked: true, value}`, or `{locked: false}` if
 * the wait budget ran out — the caller decides what to do with that, since a
 * drain must stand down but a session-close hook must not.
 *
 * Every read-modify-write of a `~/.lore` state file needs one of these: a
 * rename is atomic but not serialized, so two writers that each read, then
 * each write, silently lose one set of changes.
 */
export function withFileLock(lockPath, fn, { waitMs = QUEUE_MUTEX_WAIT_MS } = {}) {
  const deadline = Date.now() + waitMs;
  for (;;) {
    try {
      writeFileSync(lockPath, JSON.stringify({ pid: process.pid }) + '\n', { flag: 'wx' });
      break;
    } catch (err) {
      if (!isContention(err)) throw err;
      // Never take a dead holder's lock directly — unlink it and re-contend,
      // so that two processes finding the same stale lock don't both enter.
      if (!mutexHolderAlive(lockPath, Date.now())) {
        try {
          rmSync(lockPath, { force: true });
        } catch {
          // Someone else got there first, or Windows is still holding it.
        }
      }
      if (Date.now() >= deadline) return { locked: false };
      pauseSync(5);
    }
  }
  try {
    return { locked: true, value: fn() };
  } finally {
    try {
      rmSync(lockPath, { force: true });
    } catch {
      // Release is best-effort: the work is already committed, and a lock
      // left behind by a failed unlink goes stale on its own.
    }
  }
}

/** withFileLock over the capture queue — see mutexPathIn. */
export function withQueueLock(home, fn, opts) {
  return withFileLock(mutexPathIn(home), fn, opts);
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
 * Is a claimed entry still owned by a live drain (docs/issues/0136)? Two
 * timestamps, deliberately separate:
 *
 * - `claimedAt` is the claim TOKEN. The agent holds it for the whole batch
 *   and quotes it back on complete/fail/park, so it must never move.
 * - `leaseAt` is the liveness proof, renewed every time the drain finishes
 *   an entry. A three-entry batch that takes 40 minutes is a working drain,
 *   not a crashed one — keying recovery on `claimedAt` retook its remaining
 *   entries mid-run and handed them to a second terminal.
 *
 * Pre-0136 entries carry no `leaseAt`; falling back to `claimedAt` keeps
 * their old behavior exactly.
 */
export function claimAlive(entry, now) {
  return isFresh(entry.leaseAt ?? entry.claimedAt, now);
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
