#!/usr/bin/env node
/**
 * SessionStart hook (docs/issues/0023, drain protocol docs/issues/0057):
 * render a concise notification of what's waiting on this team — captures
 * queued but not yet run through the librarian, captures parked after
 * repeated failures, and proposals the librarian already opened that are
 * still awaiting review — each with the `retract` MCP call for easy
 * consent-withdrawal (CONTEXT.md: Librarian — "consent lives at promotion,
 * not capture"). There is no `lore retract` CLI: retraction is the `retract`
 * MCP tool (docs/issues/0091). With nothing queued, parked, proposed or
 * dropped, the notification is omitted entirely rather than announcing zeroes.
 *
 * Reads `${LORE_HOME:-~/.lore}/capture-queue.jsonl` (one JSON object per
 * line, written by enqueue-capture.mjs, drained via drain-queue.mjs) and
 * `${LORE_HOME:-~/.lore}/pending-proposals.json` (`{ proposals: [...],
 * drops: [...] }`, written by librarian runs — see
 * plugin/agents/librarian.md). Prints a SessionStart hook JSON payload to
 * stdout: `systemMessage` is the human-facing summary; `additionalContext`
 * additionally carries the cached org brief (docs/issues/0059, from
 * `~/.lore/org-brief.json`) and instructs the agent to drain queued
 * captures through the drain protocol. This hook only reports and
 * instructs — an entry leaves the queue when a librarian run consumes it,
 * never because it was surfaced here. Always exits 0: no network, no LLM
 * call, every failure mode is swallowed silently.
 *
 * Every interpolated field is passed through clean(): whitespace (incl.
 * newlines) collapsed and length clamped. The queue's lastError and the
 * librarian's summaries are NOT human-reviewed content — without this, a
 * crafted multi-line string could forge extra notification lines or
 * imitate the drain-instruction block.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRIEF_CAP, briefPathIn, drainEligible, loreHome, queuePathIn, readQueue } from './lib/queue.mjs';

const hooksDir = path.dirname(fileURLToPath(import.meta.url));
const drainScript = path.join(hooksDir, 'drain-queue.mjs');

/** Collapse all whitespace (newlines included) and clamp length. */
function clean(value, max) {
  const s = String(value).replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/**
 * Org brief (docs/issues/0059): a cached, descriptions-only slice of org
 * canon written by write-brief.mjs. Rendered into additionalContext only —
 * durable context for the agent, not a per-session announcement for the
 * human. Missing or corrupt cache renders nothing; malformed elements are
 * skipped individually, and BRIEF_CAP is re-applied on read so a tampered
 * cache can't inject an unbounded record list.
 */
function readBrief(briefPath) {
  if (!existsSync(briefPath)) return null;
  try {
    const raw = JSON.parse(readFileSync(briefPath, 'utf8'));
    if (!Array.isArray(raw.records)) return null;
    const records = raw.records
      .filter(
        (r) =>
          r !== null &&
          typeof r === 'object' &&
          [r.ulid, r.type, r.title, r.description].every((f) => typeof f === 'string' && f !== ''),
      )
      .slice(0, BRIEF_CAP);
    if (records.length === 0) return null;
    return { fetchedAt: raw.fetchedAt, records };
  } catch {
    return null;
  }
}

export function renderBrief(brief) {
  const lines = [];
  lines.push(
    `lore org brief (cached ${clean(brief.fetchedAt ?? 'at an unknown time', 40)}): durable org context.`,
  );
  for (const r of brief.records) {
    lines.push(`  - [${clean(r.type, 40)}] ${clean(r.title, 120)} (${clean(r.ulid, 40)}): ${clean(r.description, 300)}`);
  }
  lines.push(
    '  Fetch any of these with get_record(<ulid>) when relevant; search_knowledge for anything else.',
  );
  return lines.join('\n');
}

function readProposalsState(statePath) {
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

export function renderNotification({ queueCount, parked, proposals, drops }) {
  const lines = [];
  lines.push('lore: pending capture activity');
  lines.push(
    `  ${queueCount} pending capture${queueCount === 1 ? '' : 's'} queued for the librarian.`,
  );
  if (parked.length > 0) {
    lines.push(
      `  ${parked.length} capture${parked.length === 1 ? '' : 's'} parked after repeated failures — retry with: node "${drainScript}" retry`,
    );
    for (const p of parked) {
      lines.push(`    - ${clean(p.sessionRef ?? '(unknown session)', 80)}: ${clean(p.lastError ?? 'unknown error', 200)}`);
    }
  }
  // Only when there is something to say. Nothing in the plugin writes the
  // `proposals` array today (the librarian appends to `drops` only), so an
  // unconditional line announced "0 proposals awaiting review" in every
  // session — flatly contradicting this module's own contract above, and
  // wrong besides: the instance had proposals open at the time.
  if (proposals.length > 0) {
    lines.push(
      `  ${proposals.length} proposal${proposals.length === 1 ? '' : 's'} awaiting review.`,
    );
  }
  for (const p of proposals) {
    const ulid = clean(p.ulid ?? '<ulid>', 40);
    const label = [p.type, p.scope, p.summary]
      .filter(Boolean)
      .map((f) => clean(f, 120))
      .join(' ');
    lines.push(
      `    - ${ulid}${label ? ` ${label}` : ''} — retract with the lore MCP tool: retract(record_ulid: "${ulid}")`,
    );
  }
  if (drops.length > 0) {
    lines.push(
      `  ${drops.length} candidate${drops.length === 1 ? ' dropped as a duplicate' : 's dropped as duplicates'} on the last librarian run:`,
    );
    for (const d of drops) {
      const summary = clean(d.candidateSummary ?? '(no summary)', 200);
      const matched = clean(d.matchedUlid ?? '(unknown)', 40);
      const reason = d.reason ? `: ${clean(d.reason, 200)}` : '';
      lines.push(`    - "${summary}" matched ${matched}${reason}`);
    }
  }
  return lines.join('\n');
}

export function renderDrainInstruction() {
  return [
    'lore drain: captures are queued, and draining them is this session\'s job (docs/issues/0057).',
    'After handling the user\'s current request — or immediately as a background task if this',
    'harness supports one — launch the `librarian` agent with these instructions:',
    `  1. Run: node "${drainScript}" claim`,
    '     It prints {"claimed": [entries]}. An empty list means another session is already',
    '     draining (or nothing is ready) — stop there.',
    '  2. For each claimed entry, run the librarian capture loop over its transcriptPath and',
    '     cwd (see the librarian agent definition), then record the outcome, passing the',
    '     entry\'s claimedAt value as the claim token:',
    `       node "${drainScript}" complete <sessionRef> <claimedAt>   on success (including zero candidates)`,
    `       node "${drainScript}" fail <sessionRef> <claimedAt> <short reason>   on any error`,
    '  Never edit the queue file directly, and never skip the complete/fail call — an entry',
    '  left claimed blocks the queue until its claim expires.',
  ].join('\n');
}

function main() {
  const home = loreHome();
  const statePath = path.join(home, 'pending-proposals.json');

  const now = Date.now();
  const queue = readQueue(queuePathIn(home));
  const queued = queue.filter((e) => e.status === 'queued');
  const parked = queue.filter((e) => e.status === 'parked');
  const { proposals, drops } = readProposalsState(statePath);
  const brief = readBrief(briefPathIn(home));
  // Nothing waiting on this team ⇒ say nothing at all (docs/issues/0091). A
  // notification announcing zeroes is noise on every single session start.
  const hasActivity =
    queued.length > 0 || parked.length > 0 || proposals.length > 0 || drops.length > 0;
  const message = hasActivity
    ? renderNotification({ queueCount: queued.length, parked, proposals, drops })
    : null;
  const contextParts = message ? [message] : [];
  if (brief) contextParts.push(renderBrief(brief));
  // Only instruct a drain when a claim would actually hand something out —
  // quiet-period entries (a possibly-live Codex session) don't count yet.
  if (queue.some((e) => drainEligible(e, now))) contextParts.push(renderDrainInstruction());
  const additionalContext = contextParts.join('\n\n');

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext,
      },
      ...(message ? { systemMessage: message } : {}),
    }),
  );
}

try {
  main();
} catch {
  // Failure-silent by design.
}
// No process.exit(0): stdout to a pipe is async, and a forced exit can
// truncate a large payload mid-flush, handing the harness malformed JSON.
// Natural exit flushes and still exits 0 (the catch above swallows throws).
