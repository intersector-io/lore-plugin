#!/usr/bin/env node
/**
 * SessionStart hook (docs/issues/0023): render a concise notification of
 * what's waiting on this team — captures queued but not yet run through
 * the librarian, and proposals the librarian already opened that are still
 * awaiting review — plus the retract command for easy consent-withdrawal
 * (CONTEXT.md: Librarian — "consent lives at promotion, not capture").
 *
 * Reads `${LORE_HOME:-~/.lore}/capture-queue.jsonl` (one JSON
 * object per line, written by enqueue-capture.mjs) and
 * `${LORE_HOME:-~/.lore}/pending-proposals.json`
 * (`{ proposals: [...], drops: [...] }`, written by librarian runs — see
 * plugin/agents/librarian.md). Prints a SessionStart hook JSON payload
 * (systemMessage + additionalContext) to stdout, then truncates the queue
 * file since its entries have now been surfaced. Always exits 0: no
 * network, no LLM call, every failure mode is swallowed silently.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

function loreHome() {
  return process.env.LORE_HOME || path.join(homedir(), '.lore');
}

function readQueue(queuePath) {
  if (!existsSync(queuePath)) return [];
  const raw = readFileSync(queuePath, 'utf8');
  const entries = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(JSON.parse(trimmed));
    } catch {
      // Skip a malformed line rather than fail the whole render.
    }
  }
  return entries;
}

function readProposalsState(statePath) {
  if (!existsSync(statePath)) return { proposals: [], drops: [] };
  try {
    const raw = JSON.parse(readFileSync(statePath, 'utf8'));
    return {
      proposals: Array.isArray(raw.proposals) ? raw.proposals : [],
      drops: Array.isArray(raw.drops) ? raw.drops : [],
    };
  } catch {
    return { proposals: [], drops: [] };
  }
}

export function renderNotification({ queueCount, proposals, drops }) {
  const lines = [];
  lines.push('lore: pending capture activity');
  lines.push(
    `  ${queueCount} pending capture${queueCount === 1 ? '' : 's'} queued for the librarian.`,
  );
  lines.push(
    `  ${proposals.length} proposal${proposals.length === 1 ? '' : 's'} awaiting review.`,
  );
  for (const p of proposals) {
    const ulid = p.ulid ?? '<ulid>';
    const label = [p.type, p.scope, p.summary].filter(Boolean).join(' ');
    lines.push(`    - ${ulid}${label ? ` ${label}` : ''} — retract with: lore retract ${ulid}`);
  }
  if (drops.length > 0) {
    lines.push(
      `  ${drops.length} candidate${drops.length === 1 ? '' : 's'} dropped as duplicates on the last librarian run:`,
    );
    for (const d of drops) {
      const summary = d.candidateSummary ?? '(no summary)';
      const matched = d.matchedUlid ?? '(unknown)';
      const reason = d.reason ? `: ${d.reason}` : '';
      lines.push(`    - "${summary}" matched ${matched}${reason}`);
    }
  }
  lines.push('  Retract any open proposal before review with: lore retract <ulid>');
  return lines.join('\n');
}

function main() {
  const home = loreHome();
  const queuePath = path.join(home, 'capture-queue.jsonl');
  const statePath = path.join(home, 'pending-proposals.json');

  const queue = readQueue(queuePath);
  const { proposals, drops } = readProposalsState(statePath);
  const message = renderNotification({ queueCount: queue.length, proposals, drops });

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: message,
      },
      systemMessage: message,
    }),
  );

  // Entries have now been surfaced to the user; truncate so the next
  // session start doesn't re-report them.
  mkdirSync(home, { recursive: true });
  writeFileSync(queuePath, '', 'utf8');
}

try {
  main();
} catch {
  // Failure-silent by design.
}
process.exit(0);
