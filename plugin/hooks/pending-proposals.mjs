#!/usr/bin/env node
/**
 * The one writer for `${LORE_HOME:-~/.lore}/pending-proposals.json` — the
 * proposal/drop bookkeeping librarian runs leave behind, rendered by
 * render-pending.mjs at session start and read by the promotion skill when
 * a user asks what their recent sessions contributed — and for the
 * append-only `recurrence.jsonl` recall-failure log beside it
 * (docs/issues/0126). Same rule as drain-queue.mjs for the capture queue:
 * all state transitions live here; agents never rewrite the files
 * themselves (two prose-driven actors doing read-modify-write is how
 * appends get lost and files get torn). Invoked by agents, not a session
 * hook, so like drain-queue.mjs it rejects bad input loudly with a
 * non-zero exit.
 *
 *   record   stdin `{"proposals": [...], "drops": [...]}` (either array may
 *            be absent) — validate shape, stamp each entry with `ts`, append
 *            both arrays in one atomic write. One call per librarian run.
 *            Proposals: {ulid, type, scope, summary, ref}; drops:
 *            {candidateSummary, matchedUlid, reason?, matchedDraft?}.
 *   prune    stdin `{"ulids": [...]}` — remove proposals entries whose ulid
 *            is listed (decided ones, confirmed via get_proposal).
 *   recurrence  no stdin — aggregate recurrence.jsonl (docs/issues/0126),
 *            most-recaptured record first.
 *
 * record and prune also age drops out past TERMINAL_RETENTION_MS — the
 * docs/issues/0124 rule: terminal bookkeeping must not nag forever. A drop
 * without a `ts` (written by hand before this script existed) counts as
 * expired. `record` first appends each incoming drop to recurrence.jsonl,
 * which retention and prune never touch. A corrupt existing state file is
 * replaced, not appended to — its content was already unreadable to every
 * consumer.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  TERMINAL_RETENTION_MS,
  atomicReplace,
  entryTime,
  loreHome,
  readJsonl,
} from './lib/queue.mjs';

export function pendingProposalsPathIn(home) {
  return path.join(home, 'pending-proposals.json');
}

/** Append-only recall-failure log (docs/issues/0126); retention and prune never touch it. */
export function recurrencePathIn(home) {
  return path.join(home, 'recurrence.jsonl');
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
  // A drop that matched an open draft (the librarian dedups with
  // include_drafts) is batch-flood prevention working, not a recall failure
  // — recurrence excludes it, so the flag must survive into the log.
  if (d.matchedDraft === true) drop.matchedDraft = true;
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
      // Append the durable log BEFORE the state write: if the append fails,
      // nothing is recorded anywhere and the loud exit makes the librarian
      // retry cleanly. Known, accepted gap (the writeQueue rule): a state
      // write that fails AFTER the append double-counts the drops on retry —
      // one reason `recurrence` reports an upper bound, never an exact count.
      if (drops.length > 0) {
        appendFileSync(
          recurrencePathIn(home),
          drops.map((d) => JSON.stringify(d)).join('\n') + '\n',
          'utf8',
        );
      }
      const state = readState(statePath);
      state.proposals.push(...proposals);
      state.drops.push(...drops);
      write(statePath, state, now);
      return;
    }
    case 'recurrence': {
      const counts = new Map();
      let total = 0;
      let draftMatches = 0;
      for (const entry of readJsonl(recurrencePathIn(home))) {
        if (!nonEmptyString(entry?.matchedUlid)) continue;
        if (entry.matchedDraft === true) {
          draftMatches += 1;
          continue;
        }
        total += 1;
        const agg = counts.get(entry.matchedUlid) ?? { count: 0, lastTs: '' };
        agg.count += 1;
        // Writer-stamped ts is toISOString() (fixed-width UTC), where
        // lexicographic order is chronological.
        if (typeof entry.ts === 'string' && entry.ts > agg.lastTs) agg.lastTs = entry.ts;
        counts.set(entry.matchedUlid, agg);
      }
      const records = [...counts]
        .map(([matchedUlid, { count, lastTs }]) => ({ matchedUlid, count, lastTs }))
        .sort((a, b) => b.count - a.count || b.lastTs.localeCompare(a.lastTs));
      process.stdout.write(JSON.stringify({ total, draftMatches, records }, null, 2) + '\n');
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
  process.stderr.write('usage: pending-proposals.mjs record | prune | recurrence (record and prune take input on stdin)\n');
  process.exitCode = 1;
}

main();
