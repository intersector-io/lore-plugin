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
 */
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

function loreHome() {
  return process.env.LORE_HOME || path.join(homedir(), '.lore');
}

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
  const entry = {
    ts: new Date().toISOString(),
    sessionRef: input.session_id ?? null,
    transcriptPath: input.transcript_path ?? null,
    cwd: input.cwd ?? null,
  };
  appendFileSync(path.join(home, 'capture-queue.jsonl'), JSON.stringify(entry) + '\n', 'utf8');
}

try {
  main();
} catch {
  // Failure-silent by design: a broken queue write must never surface to
  // the user or delay session close.
}
process.exit(0);
