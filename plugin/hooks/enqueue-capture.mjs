#!/usr/bin/env node
/**
 * SessionEnd hook (docs/issues/0023): enqueue a librarian capture run for
 * this session by appending one JSONL line to capture-queue.jsonl. Must
 * never delay session close and must never fail visibly: no network, no
 * LLM call, always exits 0, every failure mode (unwritable home dir,
 * malformed/absent stdin) is swallowed. Actually draining the queue and
 * running the librarian agent against it is a separate, later step (a
 * human or scheduler) — this script only records that a session happened.
 *
 * Reads the SessionEnd hook's stdin JSON (session_id, transcript_path,
 * cwd — see Claude Code hooks reference) and writes
 * `${LORE_HOME:-~/.lore}/capture-queue.jsonl`.
 *
 * Dedupes by session id (docs/issues/0054): Codex has no SessionEnd event,
 * so its wiring fires this on Stop — once per turn, not once per session.
 * A session already queued is never queued again — but a per-turn Stop for
 * a still-queued entry refreshes its `ts`, so the entry's age means "time
 * since last activity" and the drain quiet period (lib/queue.mjs
 * DRAIN_QUIET_MS) can keep a live Codex session from being drained
 * mid-flight. Entries with no session id are never deduped (an unknown
 * stdin shape must still record sessions).
 */
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { loreHome, queuePathIn, readQueue, writeQueue } from './lib/queue.mjs';

function readStdinJson() {
  if (process.stdin.isTTY) return {};
  try {
    const raw = readFileSync(0, 'utf8');
    if (!raw || !raw.trim()) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function main() {
  const input = readStdinJson();
  const home = loreHome();
  mkdirSync(home, { recursive: true });
  const queuePath = queuePathIn(home);
  const sessionRef = input.session_id ?? null;
  if (sessionRef !== null) {
    const entries = readQueue(queuePath);
    const existing = entries.find((e) => e.sessionRef === sessionRef);
    if (existing) {
      // Codex per-turn Stop: touch the still-queued entry so its age
      // reflects last activity, not the first turn. Never resurrect an
      // entry the drain already moved past `queued`.
      if (existing.status === 'queued') {
        existing.ts = new Date().toISOString();
        writeQueue(queuePath, entries);
      }
      return;
    }
  }
  const entry = {
    ts: new Date().toISOString(),
    sessionRef,
    transcriptPath: input.transcript_path ?? null,
    cwd: input.cwd ?? null,
    event: input.hook_event_name ?? null,
    status: 'queued',
    attempts: 0,
  };
  appendFileSync(queuePath, JSON.stringify(entry) + '\n', 'utf8');
}

try {
  main();
} catch {
  // Failure-silent by design: a broken queue write must never surface to
  // the user or delay session close.
}
process.exit(0);
