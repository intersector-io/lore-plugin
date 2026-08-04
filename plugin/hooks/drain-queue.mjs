#!/usr/bin/env node
/**
 * Capture-queue drain protocol (docs/issues/0057). NOT a session hook —
 * this is invoked by the agent draining the queue (the librarian run the
 * SessionStart notification asks for), so unlike the hooks it may print
 * errors and exit non-zero on bad usage. All queue state transitions live
 * here; the agent never rewrites the file itself.
 *
 *   claim                        select up to DRAIN_BATCH_SIZE oldest
 *                                drain-eligible entries (SessionEnd
 *                                entries immediately; Stop entries only
 *                                after DRAIN_QUIET_MS of no activity),
 *                                mark them draining, take the drain lock,
 *                                print {"claimed": [...]} — empty when
 *                                another fresh drain holds the lock.
 *                                Also: recovers stale draining claims
 *                                (counts as a failed attempt), parks
 *                                entries with no readable transcript or
 *                                no session ref, prunes done/parked
 *                                entries past retention.
 *   complete <ref> <token>       mark the claimed entry done
 *   fail <ref> <token> [msg]     count a failed attempt; re-queue, or
 *                                park at MAX_ATTEMPTS
 *   park <ref> <token> [msg]     park the claimed entry immediately — for
 *                                errors a retry cannot fix (no scope
 *                                marker + scope not in the contribute
 *                                set), so a permanent mismatch costs one
 *                                librarian run, not MAX_ATTEMPTS of them
 *   retry                        reset every parked entry to queued
 *                                (attempts 0); prunes expired ones
 *   clear                        drop every parked entry now — the escape
 *                                hatch for unrecoverable parks (transcript
 *                                gone, scope never to be opened) that
 *                                would otherwise nag every session start
 *                                until 14-day retention ages them out
 *   status                       read-only {queued, parked} counts, with
 *                                the same expiry rules the notification
 *                                applies
 *
 * <token> is the entry's `claimedAt` exactly as printed by `claim`. It
 * makes transitions claim-specific: a slow drain whose claim expired and
 * was re-claimed by another session gets a clean rejection instead of
 * silently mutating the live claim (attempt inflation → bogus park).
 *
 * The lock auto-releases when no entry is left draining, so a drain that
 * forgets nothing more than its own bookkeeping cannot wedge the queue —
 * and a crashed one is recovered by the next claim after STALE_CLAIM_MS.
 */
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import {
  DRAIN_BATCH_SIZE,
  MAX_ATTEMPTS,
  claimAlive,
  drainEligible,
  entryTime,
  lockIsFresh,
  lockPathIn,
  loreHome,
  pausePathIn,
  queuePathIn,
  readLock,
  readQueue,
  terminalExpired,
  transcriptMissing,
  withQueueLock,
  writeQueue,
} from './lib/queue.mjs';

/**
 * The one constructor for a parked entry: status, retention restamp (ts ages
 * from the transition into parked, the same way `complete` restamps for
 * done), lastError, and no claim. Every park — fail-at-cap, claim's
 * unrecoverable entries, the explicit `park` command — goes through it.
 */
function parkEntry(entry, message, now, attempts = entry.attempts) {
  const parked = { ...entry, attempts, status: 'parked', ts: new Date(now).toISOString(), lastError: message };
  delete parked.claimedAt;
  delete parked.leaseAt;
  return parked;
}

function failEntry(entry, message, now) {
  const attempts = entry.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) return parkEntry(entry, message, now, attempts);
  const failed = { ...entry, attempts, status: 'queued', lastError: message };
  delete failed.claimedAt;
  delete failed.leaseAt;
  return failed;
}

function takeLock(lockPath, now) {
  writeFileSync(
    lockPath,
    JSON.stringify({ pid: process.pid, ts: new Date(now).toISOString() }) + '\n',
    'utf8',
  );
}

function draining(entries) {
  return entries.some((e) => e.status === 'draining');
}

/**
 * Release the drain lease once nothing is left draining. Deliberately never
 * RENEWS: a losing `claim` must not extend the lease of the drain that beat
 * it, or a crashed holder's lease would be refreshed by every session start
 * and never go stale — the queue would wedge forever.
 */
function releaseLockIfIdle(entries, lockPath) {
  if (!draining(entries)) rmSync(lockPath, { force: true });
}

/**
 * The transition counterpart: finishing an entry is proof the drain is alive
 * and working, so it renews the lease over the rest of its batch
 * (docs/issues/0136) — which is what makes a slow three-entry run safe
 * without asking the agent to heartbeat.
 */
function renewOrReleaseLock(entries, lockPath, now) {
  if (draining(entries)) takeLock(lockPath, now);
  else rmSync(lockPath, { force: true });
}

function claim(home, now) {
  const queuePath = queuePathIn(home);
  const lockPath = lockPathIn(home);
  let entries = readQueue(queuePath);

  // A crashed drain left entries claimed forever ago: that claim was a
  // failed attempt. Live claims — ones whose lease is still being renewed —
  // belong to a working drain, leave them. (claimAlive treats a FUTURE
  // timestamp as stale, same as the lock.)
  entries = entries.map((e) => {
    if (e.status !== 'draining') return e;
    if (claimAlive(e, now)) return e;
    return failEntry(e, 'drain claim expired', now);
  });

  entries = entries.filter((e) => !terminalExpired(e, now));

  const lock = readLock(lockPath);
  const lockHeld = lockIsFresh(lock, now) && entries.some((e) => e.status === 'draining');
  const claimed = [];
  if (!lockHeld) {
    entries = entries.map((e) => {
      if (e.status !== 'queued') return e;
      // No transcript to read means no librarian run can ever succeed;
      // no sessionRef means no complete/fail call could ever address the
      // entry (transitions match by ref), so claiming it would only
      // starve the batch until it force-parks.
      if (!e.sessionRef) return parkEntry(e, 'no session ref', now);
      if (transcriptMissing(e.transcriptPath)) return parkEntry(e, 'transcript missing', now);
      return e;
    });
    // Capture pause marker (see pausePathIn in lib/queue.mjs): gate only the
    // hand-out — recovery, pruning, parking, and lock release still run, so
    // a pause never freezes queue self-healing.
    const paused = existsSync(pausePathIn(home));
    const batch = paused
      ? []
      : entries
          .filter((e) => drainEligible(e, now))
          .sort((a, b) => entryTime(a) - entryTime(b))
          .slice(0, DRAIN_BATCH_SIZE);
    for (const entry of batch) {
      entry.status = 'draining';
      entry.claimedAt = new Date(now).toISOString();
      entry.leaseAt = entry.claimedAt;
      claimed.push(entry);
    }
    if (claimed.length > 0) takeLock(lockPath, now);
  }

  writeQueue(queuePath, entries);
  releaseLockIfIdle(entries, lockPath);
  process.stdout.write(JSON.stringify({ claimed }) + '\n');
}

function transition(home, sessionRef, claimToken, apply, now) {
  const queuePath = queuePathIn(home);
  const entries = readQueue(queuePath);
  const entry = entries.find(
    (e) => e.sessionRef === sessionRef && e.status === 'draining' && e.claimedAt === claimToken,
  );
  if (!entry) {
    process.stderr.write(
      `no draining entry for session ${sessionRef} with claim token ${claimToken} — ` +
        'the claim may have expired and been taken over; do not retry, the queue self-heals\n',
    );
    process.exitCode = 1;
    return;
  }
  // Finishing one entry renews the lease on the rest of this drain's batch —
  // see claimAlive (docs/issues/0136). `claimedAt` is the token the agent is
  // still holding for them and is deliberately left alone.
  const updated = entries.map((e) => {
    if (e === entry) return apply(e);
    if (e.status === 'draining') return { ...e, leaseAt: new Date(now).toISOString() };
    return e;
  });
  writeQueue(queuePath, updated);
  renewOrReleaseLock(updated, lockPathIn(home), now);
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const home = loreHome();
  mkdirSync(home, { recursive: true });
  const now = Date.now();

  /**
   * Every command that rewrites the queue runs here, as the sole writer
   * (docs/issues/0136). Losing the mutex is not a queue error and never
   * mutates anything: it means another terminal is mid-write, so the caller
   * stands down and the next session start picks the work up.
   */
  const exclusively = (fn) => {
    if (!withQueueLock(home, fn).locked) {
      process.stderr.write(
        'another process is writing the capture queue — nothing was changed; try again\n',
      );
      process.exitCode = 1;
    }
  };

  switch (command) {
    case 'claim':
      exclusively(() => claim(home, now));
      return;
    case 'complete': {
      if (!rest[0] || !rest[1]) break;
      exclusively(() =>
        transition(home, rest[0], rest[1], (e) => {
          const done = { ...e, status: 'done', ts: new Date(now).toISOString() };
          delete done.claimedAt;
          delete done.leaseAt;
          delete done.lastError;
          return done;
        }, now),
      );
      return;
    }
    case 'fail': {
      if (!rest[0] || !rest[1]) break;
      exclusively(() =>
        transition(home, rest[0], rest[1], (e) =>
          failEntry(e, rest.slice(2).join(' ') || 'librarian run failed', now), now,
        ),
      );
      return;
    }
    case 'park': {
      if (!rest[0] || !rest[1]) break;
      exclusively(() =>
        transition(home, rest[0], rest[1], (e) =>
          parkEntry(e, rest.slice(2).join(' ') || 'parked as unrecoverable', now), now,
        ),
      );
      return;
    }
    case 'status': {
      // Read-only counts for anyone answering "what's waiting?" (e.g. the
      // promotion skill's nothing-proposed-yet fallback). Counting raw
      // JSONL lines is always wrong: done/draining rows and expired parks
      // aren't pending — the same predicates render-pending.mjs applies.
      const entries = readQueue(queuePathIn(home));
      const queued = entries.filter((e) => e.status === 'queued').length;
      const parked = entries.filter(
        (e) => e.status === 'parked' && !terminalExpired(e, now),
      ).length;
      process.stdout.write(JSON.stringify({ queued, parked }) + '\n');
      return;
    }
    case 'retry': {
      const queuePath = queuePathIn(home);
      // An expired parked entry is pruned, never resurrected — it was no
      // longer being shown, so retrying it would revive work the user never
      // saw (docs/issues/0124).
      exclusively(() => {
        const entries = readQueue(queuePath)
          .filter((e) => !terminalExpired(e, now))
          .map((e) => {
            if (e.status !== 'parked') return e;
            const retried = { ...e, status: 'queued', attempts: 0 };
            delete retried.lastError;
            return retried;
          });
        writeQueue(queuePath, entries);
      });
      return;
    }
    case 'clear': {
      const queuePath = queuePathIn(home);
      exclusively(() =>
        writeQueue(
          queuePath,
          readQueue(queuePath).filter((e) => e.status !== 'parked'),
        ),
      );
      return;
    }
  }
  process.stderr.write(
    'usage: drain-queue.mjs claim | complete <sessionRef> <claimToken> | fail <sessionRef> <claimToken> [message] | park <sessionRef> <claimToken> [message] | retry | clear | status\n',
  );
  process.exitCode = 1;
}

main();
