#!/usr/bin/env node
/**
 * The one writer for `${LORE_HOME:-~/.lore}/pending-proposals.json` — the
 * proposal/drop bookkeeping librarian runs leave behind, rendered by
 * render-pending.mjs at session start and read by the promotion skill when
 * a user asks what their recent sessions contributed. Same rule as
 * drain-queue.mjs for the capture queue: all state transitions live here;
 * agents never rewrite the file themselves (two prose-driven actors doing
 * read-modify-write is how appends get lost and files get torn). Invoked by
 * agents, not a session hook, so like drain-queue.mjs it rejects bad input
 * loudly with a non-zero exit.
 *
 *   record   stdin `{"proposals": [...], "drops": [...]}` (either array may
 *            be absent) — validate shape, stamp each entry with `ts`, append
 *            both arrays in one atomic write. One call per librarian run.
 *            Proposals: {ulid, type, scope, summary, ref}; drops:
 *            {candidateSummary, matchedUlid, reason?}.
 *   prune    stdin `{"ulids": [...]}` — remove proposals entries whose ulid
 *            is listed (decided ones, confirmed via get_proposal).
 *
 * Every invocation also ages drops out past TERMINAL_RETENTION_MS — the
 * docs/issues/0124 rule: terminal bookkeeping must not nag forever. A drop
 * without a `ts` (written by hand before this script existed) counts as
 * expired. A corrupt existing file is replaced, not appended to — its
 * content was already unreadable to every consumer.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { TERMINAL_RETENTION_MS, atomicReplace, entryTime, loreHome } from './lib/queue.mjs';

export function pendingProposalsPathIn(home) {
  return path.join(home, 'pending-proposals.json');
}

function fail(message) {
  process.stderr.write(`pending-proposals.mjs: ${message}\n`);
  process.exit(1);
}

function readState(statePath) {
  if (!existsSync(statePath)) return { proposals: [], drops: [] };
  try {
    const raw = JSON.parse(readFileSync(statePath, 'utf8'));
    const objects = (list) =>
      Array.isArray(list) ? list.filter((x) => x !== null && typeof x === 'object') : [];
    return { proposals: objects(raw.proposals), drops: objects(raw.drops) };
  } catch {
    return { proposals: [], drops: [] };
  }
}

function readStdinJson() {
  let raw;
  try {
    raw = readFileSync(0, 'utf8');
  } catch {
    fail('could not read stdin');
  }
  try {
    return JSON.parse(raw);
  } catch {
    fail('stdin is not valid JSON');
  }
}

const nonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';

function validateProposal(p) {
  if (!['ulid', 'type', 'scope', 'summary', 'ref'].every((k) => nonEmptyString(p?.[k]))) {
    fail('every proposal needs non-empty string ulid/type/scope/summary/ref');
  }
  return { ulid: p.ulid, type: p.type, scope: p.scope, summary: p.summary, ref: p.ref };
}

function validateDrop(d) {
  if (!nonEmptyString(d?.candidateSummary) || !nonEmptyString(d?.matchedUlid)) {
    fail('every drop needs non-empty string candidateSummary/matchedUlid');
  }
  const drop = { candidateSummary: d.candidateSummary, matchedUlid: d.matchedUlid };
  if (nonEmptyString(d.reason)) drop.reason = d.reason;
  return drop;
}

function write(statePath, state, now) {
  state.drops = state.drops.filter((d) => now - entryTime(d) < TERMINAL_RETENTION_MS);
  atomicReplace(statePath, JSON.stringify(state, null, 2) + '\n');
}

function main() {
  const [command] = process.argv.slice(2);
  const home = loreHome();
  mkdirSync(home, { recursive: true });
  const statePath = pendingProposalsPathIn(home);
  const now = Date.now();
  const ts = new Date(now).toISOString();

  switch (command) {
    case 'record': {
      const input = readStdinJson();
      const proposals = (Array.isArray(input.proposals) ? input.proposals : []).map((p) => ({
        ...validateProposal(p),
        ts,
      }));
      const drops = (Array.isArray(input.drops) ? input.drops : []).map((d) => ({
        ...validateDrop(d),
        ts,
      }));
      const state = readState(statePath);
      state.proposals.push(...proposals);
      state.drops.push(...drops);
      write(statePath, state, now);
      return;
    }
    case 'prune': {
      const input = readStdinJson();
      if (!Array.isArray(input.ulids) || !input.ulids.every(nonEmptyString)) {
        fail('expected {"ulids": ["..."]} on stdin');
      }
      const gone = new Set(input.ulids);
      const state = readState(statePath);
      state.proposals = state.proposals.filter((p) => !gone.has(p.ulid));
      write(statePath, state, now);
      return;
    }
  }
  process.stderr.write('usage: pending-proposals.mjs record | prune (input on stdin)\n');
  process.exitCode = 1;
}

main();
