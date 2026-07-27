#!/usr/bin/env node
/**
 * Org-brief cache writer (docs/issues/0059). NOT a session hook — the
 * agent refreshing the brief (the librarian at the end of a drain run)
 * pipes `{"records": [{ulid, type, title, description}, ...]}` from
 * list_records results on stdin, and this writes
 * `${LORE_HOME:-~/.lore}/org-brief.json` for render-pending.mjs to render
 * at future session starts. Keeping the file format here (not in agent
 * improvisation) is the point; like drain-queue.mjs it may reject bad
 * input loudly with a non-zero exit.
 *
 * The cache is durable context, not live data: SessionStart renders it
 * no-network, stale-is-fine. Records beyond BRIEF_CAP are dropped in the
 * given order — callers should list company-profile records first.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { BRIEF_CAP, briefPathIn, loreHome } from './lib/queue.mjs';

function fail(message) {
  process.stderr.write(message + '\n');
  process.exit(1);
}

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    fail('write-brief.mjs: stdin is not valid JSON');
  }
  if (!Array.isArray(input?.records)) {
    fail('write-brief.mjs: expected {"records": [...]} on stdin');
  }
  // Cap BEFORE validating: a malformed record in the discarded tail must
  // not reject an otherwise-valid brief it was never going to be part of.
  const records = [];
  for (const r of input.records.slice(0, BRIEF_CAP)) {
    const fields = [r?.ulid, r?.type, r?.title, r?.description];
    if (!fields.every((f) => typeof f === 'string' && f.trim() !== '')) {
      fail('write-brief.mjs: every record needs non-empty string ulid/type/title/description');
    }
    records.push({ ulid: r.ulid, type: r.type, title: r.title, description: r.description });
  }
  const home = loreHome();
  mkdirSync(home, { recursive: true });
  writeFileSync(
    briefPathIn(home),
    JSON.stringify({ fetchedAt: new Date().toISOString(), records }, null, 2) + '\n',
    'utf8',
  );
}

main();
