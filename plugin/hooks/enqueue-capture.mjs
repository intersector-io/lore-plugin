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
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolveScopeMarker } from './lib/scope-marker.mjs';
import {
  loreHome,
  pausePathIn,
  queuePathIn,
  readQueue,
  transcriptMissing,
  writeQueue,
} from './lib/queue.mjs';

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
  // Capture pause marker — see pausePathIn in lib/queue.mjs.
  if (existsSync(pausePathIn(home))) return;
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
  // A transcript path absent at session end never appears later — it is the
  // ghost of a mid-session id rotation (docs/issues/0124); the real file's
  // own SessionEnd enqueues the capture under its own id. A null path
  // (unknown stdin shape) still records the session, as before.
  if (typeof input.transcript_path === 'string' && transcriptMissing(input.transcript_path)) {
    return;
  }
  // Scope marker (ADR-0023): resolved here, at enqueue time, so the
  // librarian gets a deterministic answer for the CWD repo instead of
  // re-deriving one later — the checkout may have moved on by drain time.
  // Only cwd: this hook never reads the transcript, so candidates from
  // OTHER repos a multi-repo session touched are scoped at drain time by
  // the librarian via resolve-scope.mjs, accepting that staleness hazard
  // for repos the hook cannot see (docs/issues/0127). Scope null
  // means "no marker": the librarian infers and says so. A marker that
  // exists but doesn't parse also yields scope null, flagged
  // `markerMalformed` so the librarian can name the broken file instead of
  // just "inferred" — this hook is failure-silent and cannot warn anyone
  // itself.
  const marker = resolveScopeMarker(input.cwd ?? null);
  const entry = {
    ts: new Date().toISOString(),
    sessionRef,
    transcriptPath: input.transcript_path ?? null,
    cwd: input.cwd ?? null,
    scope: marker?.scope ?? null,
    ...(marker?.malformed ? { markerMalformed: true } : {}),
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
