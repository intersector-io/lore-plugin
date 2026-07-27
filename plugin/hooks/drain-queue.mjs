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
 *                                no session ref, prunes old done entries.
 *   complete <ref> <token>       mark the claimed entry done
 *   fail <ref> <token> [msg]     count a failed attempt; re-queue, or
 *                                park at MAX_ATTEMPTS
 *   retry                        reset every parked entry to queued
 *                                (attempts 0)
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
  DONE_RETENTION_MS,
  DRAIN_BATCH_SIZE,
  MAX_ATTEMPTS,
  drainEligible,
  entryTime,
  isFresh,
  lockIsFresh,
  lockPathIn,
  loreHome,
  queuePathIn,
  readLock,
  readQueue,
  writeQueue,
} from './lib/queue.mjs';

function failEntry(entry, message) {
  const attempts = entry.attempts + 1;
  const failed = { ...entry, attempts, lastError: message };
  delete failed.claimedAt;
  failed.status = attempts >= MAX_ATTEMPTS ? 'parked' : 'queued';
  return failed;
}

function releaseLockIfIdle(entries, lockPath) {
  if (!entries.some((e) => e.status === 'draining')) {
    rmSync(lockPath, { force: true });
  }
}

function claim(home, now) {
  const queuePath = queuePathIn(home);
  const lockPath = lockPathIn(home);
  let entries = readQueue(queuePath);

  // A crashed drain left entries claimed forever ago: that claim was a
  // failed attempt. Fresh claims belong to a live drain — leave them.
  // (isFresh also treats a FUTURE claimedAt as stale, same as the lock.)
  entries = entries.map((e) => {
    if (e.status !== 'draining') return e;
    if (isFresh(e.claimedAt, now)) return e;
    return failEntry(e, 'drain claim expired');
  });

  entries = entries.filter(
    (e) => e.status !== 'done' || now - entryTime(e) < DONE_RETENTION_MS,
  );

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
      if (!e.sessionRef) {
        return { ...e, status: 'parked', lastError: 'no session ref' };
      }
      if (!e.transcriptPath || !existsSync(e.transcriptPath)) {
        return { ...e, status: 'parked', lastError: 'transcript missing' };
      }
      return e;
    });
    const batch = entries
      .filter((e) => drainEligible(e, now))
      .sort((a, b) => entryTime(a) - entryTime(b))
      .slice(0, DRAIN_BATCH_SIZE);
    for (const entry of batch) {
      entry.status = 'draining';
      entry.claimedAt = new Date(now).toISOString();
      claimed.push(entry);
    }
    if (claimed.length > 0) {
      writeFileSync(
        lockPath,
        JSON.stringify({ pid: process.pid, ts: new Date(now).toISOString() }) + '\n',
        'utf8',
      );
    }
  }

  writeQueue(queuePath, entries);
  releaseLockIfIdle(entries, lockPath);
  process.stdout.write(JSON.stringify({ claimed }) + '\n');
}

function transition(home, sessionRef, claimToken, apply) {
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
  const updated = entries.map((e) => (e === entry ? apply(e) : e));
  writeQueue(queuePath, updated);
  releaseLockIfIdle(updated, lockPathIn(home));
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const home = loreHome();
  mkdirSync(home, { recursive: true });
  const now = Date.now();

  switch (command) {
    case 'claim':
      claim(home, now);
      return;
    case 'complete': {
      if (!rest[0] || !rest[1]) break;
      transition(home, rest[0], rest[1], (e) => {
        const done = { ...e, status: 'done', ts: new Date(now).toISOString() };
        delete done.claimedAt;
        delete done.lastError;
        return done;
      });
      return;
    }
    case 'fail': {
      if (!rest[0] || !rest[1]) break;
      transition(home, rest[0], rest[1], (e) =>
        failEntry(e, rest.slice(2).join(' ') || 'librarian run failed'),
      );
      return;
    }
    case 'retry': {
      const queuePath = queuePathIn(home);
      const entries = readQueue(queuePath).map((e) => {
        if (e.status !== 'parked') return e;
        const retried = { ...e, status: 'queued', attempts: 0 };
        delete retried.lastError;
        return retried;
      });
      writeQueue(queuePath, entries);
      return;
    }
  }
  process.stderr.write(
    'usage: drain-queue.mjs claim | complete <sessionRef> <claimToken> | fail <sessionRef> <claimToken> [message] | retry\n',
  );
  process.exitCode = 1;
}

main();
