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
 * drops: [...], parked: [...] }`, written by librarian runs — see
 * plugin/agents/librarian.md). Prints a SessionStart hook JSON payload to
 * stdout: `systemMessage` is the human-facing summary; `additionalContext`
 * additionally carries the cached org brief (docs/issues/0059, from
 * `~/.lore/org-brief.json`) and instructs the agent to drain queued
 * captures through the drain protocol. This hook only reports and
 * instructs — an entry leaves the queue when a librarian run consumes it,
 * never because it was surfaced here. Always exits 0: no network, no LLM
 * call, every failure mode is swallowed silently.
 *
 * The drain instruction text (renderDrainInstruction) is deliberately framed
 * so the drain can never eclipse the answer to the user's actual request: a
 * headless `claude -p` run only ever prints the session's FINAL message, so
 * an agent that dutifully drains "after handling the request" and then
 * reports the drain outcome last has just swallowed its own answer (observed
 * twice in headless/CI runs). There is no reliable signal available to this
 * hook — env or stdin — that distinguishes a headless invocation from an
 * interactive one (SessionStart's stdin carries no such flag, and nothing in
 * this process's env is documented as one), so the fix is instruction
 * framing, not detection: prefer a background/detached subagent when the
 * harness supports one, and unconditionally require the final message to be
 * the answer, never the drain report, when it doesn't.
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
import {
  BRIEF_CAP,
  briefPathIn,
  drainEligible,
  loreHome,
  pausePathIn,
  queuePathIn,
  readQueue,
  terminalExpired,
} from './lib/queue.mjs';

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
  if (!existsSync(statePath)) return { proposals: [], drops: [], parkedCandidates: [] };
  try {
    const raw = JSON.parse(readFileSync(statePath, 'utf8'));
    const objects = (list) =>
      Array.isArray(list) ? list.filter((x) => x !== null && typeof x === 'object') : [];
    return {
      proposals: objects(raw.proposals),
      drops: objects(raw.drops),
      parkedCandidates: objects(raw.parked),
    };
  } catch {
    return { proposals: [], drops: [], parkedCandidates: [] };
  }
}

export function renderNotification({ queueCount, parked, proposals, drops, parkedCandidates = [] }) {
  const lines = [];
  lines.push('lore: pending capture activity');
  lines.push(
    `  ${queueCount} pending capture${queueCount === 1 ? '' : 's'} queued for the librarian.`,
  );
  if (parked.length > 0) {
    // The header stays cause-agnostic: each park's lastError names its own
    // fix (the librarian is instructed to say how to unblock, e.g. add the
    // repo's .lore/scope.yml or open the scope in the access matrix).
    lines.push(
      `  ${parked.length} capture${parked.length === 1 ? '' : 's'} parked — these will not drain again on their own. Fix the cause named below, then re-enqueue with: node "${drainScript}" retry — or dismiss all parked with: node "${drainScript}" clear`,
    );
    // Group identical errors: a machine with dozens of "transcript missing"
    // ghosts (docs/issues/0124) must not print dozens of identical lines on
    // every session start — one line per distinct cause, with a count.
    const byError = new Map();
    for (const p of parked) {
      const error = clean(p.lastError ?? 'unknown error', 200);
      const seen = byError.get(error);
      if (seen) seen.count += 1;
      else byError.set(error, { first: clean(p.sessionRef ?? '(unknown session)', 80), count: 1 });
    }
    for (const [error, { first, count }] of byError) {
      lines.push(
        count === 1 ? `    - ${first}: ${error}` : `    - ${count} captures (${first}, …): ${error}`,
      );
    }
  }
  // Omitted when empty: a machine with no librarian runs yet would
  // otherwise announce "0 proposals awaiting review" every session.
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
  // Contribute-mismatched candidates (docs/issues/0128): captured but never
  // proposed — a permissions/marker problem only a human can fix, so it must
  // surface here rather than living only in a librarian run's transient notes.
  if (parkedCandidates.length > 0) {
    lines.push(
      `  ${parkedCandidates.length} candidate${parkedCandidates.length === 1 ? '' : 's'} parked — scope not in your contribute set (fix the access matrix or the repo's .lore/scope.yml):`,
    );
    for (const p of parkedCandidates) {
      const summary = clean(p.candidateSummary ?? '(no summary)', 200);
      const scope = clean(p.scope ?? '(unknown scope)', 60);
      const reason = p.reason ? `: ${clean(p.reason, 200)}` : '';
      lines.push(`    - "${summary}" → ${scope}${reason}`);
    }
  }
  return lines.join('\n');
}

/**
 * Capture pause marker (see pausePathIn in lib/queue.mjs): announced on
 * EVERY session start while it exists, so a pause can't be forgotten.
 */
export function renderPausedNotice(pausePath) {
  return [
    'lore: capture is paused — this session will not be captured, and queued captures will not drain.',
    `  Resume with the capture-pause skill, or: rm "${pausePath}"`,
  ].join('\n');
}

/**
 * A park whose cause is a scope/marker/permissions mismatch is fixable by
 * an agent in an interactive session — but only with the user in the loop:
 * the slug is a naming decision and the marker must be committed to the
 * working repo, and opening a scope in the access matrix is an admin act
 * (ADR-0023 / ADR-0010: surfaced, never silently substituted). Heuristic
 * match on the free-text reason; the librarian is instructed to name the
 * marker/scope in every such park reason.
 */
export function isScopePark(reason) {
  return /scope|\.lore\/scope\.yml|access matrix|contribute/i.test(String(reason ?? ''));
}

/**
 * Agent-facing (additionalContext only): turn a scope park from a list of
 * manual steps for the human into an offer the agent makes this session.
 */
export function renderScopeParkFixInstruction() {
  return [
    'lore scope parks: some captures above are parked on a scope/marker mismatch — a condition',
    'you can fix WITH the user, never silently (the scope slug is a naming decision and the',
    'marker must be committed):',
    '  1. Offer to create `.lore/scope.yml` at the working repo root (`scope: product:<slug>`',
    '     or `team:<slug>`; `org` is refused) and commit it. Confirm the slug with the user —',
    '     never guess it.',
    '  2. If the scope does not exist in the deployment, an admin must open it in the access',
    '     matrix (the `set_authorization` MCP tool, or the onboarding skill walks through it).',
    '     If the user is not an admin, tell them who to ask; do not work around the matrix.',
    `  3. Once both are in place, re-enqueue the parked captures: node "${drainScript}" retry`,
  ].join('\n');
}

export function renderDrainInstruction() {
  return [
    'lore drain: captures are queued, and draining them is this session\'s job (docs/issues/0057).',
    'Prefer launching the `librarian` agent as a background/detached subagent if this harness',
    'supports one, so the drain runs without ever becoming this turn\'s visible output. If it',
    'does not, run the drain only after you have fully answered the user\'s current request.',
    'In ALL cases, no exceptions: your final message must answer the user\'s request — never end',
    'this turn on the drain report. A headless run (e.g. `claude -p`) prints only the final',
    'message, so a drain summary written last silently swallows the real answer.',
    'Instructions for the drain itself:',
    `  1. Run: node "${drainScript}" claim`,
    '     It prints {"claimed": [entries]}. An empty list means another session is already',
    '     draining (or nothing is ready) — stop there.',
    '  2. For each claimed entry, run the librarian capture loop over its transcriptPath and',
    '     cwd (see the librarian agent definition), then record the outcome, passing the',
    '     entry\'s claimedAt value as the claim token:',
    `       node "${drainScript}" complete <sessionRef> <claimedAt>   on success (including zero candidates)`,
    `       node "${drainScript}" fail <sessionRef> <claimedAt> <short reason>   on a transient error`,
    `       node "${drainScript}" park <sessionRef> <claimedAt> <short reason>   on a permanent one (e.g. scope not proposable) — a reason a retry cannot fix`,
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
  // Parked entries past retention are ignored, not deleted — this hook is
  // read-only; the next claim prunes them. Without this, a parked-only queue
  // (which never triggers a claim) would nag forever (docs/issues/0124).
  const parked = queue.filter((e) => e.status === 'parked' && !terminalExpired(e, now));
  const { proposals, drops, parkedCandidates } = readProposalsState(statePath);
  const brief = readBrief(briefPathIn(home));
  // Nothing waiting on this team ⇒ say nothing at all (docs/issues/0091). A
  // notification announcing zeroes is noise on every single session start.
  const hasActivity =
    queued.length > 0 ||
    parked.length > 0 ||
    proposals.length > 0 ||
    drops.length > 0 ||
    parkedCandidates.length > 0;
  const pausePath = pausePathIn(home);
  const paused = existsSync(pausePath);
  const messageParts = [];
  if (paused) messageParts.push(renderPausedNotice(pausePath));
  if (hasActivity) {
    messageParts.push(
      renderNotification({ queueCount: queued.length, parked, proposals, drops, parkedCandidates }),
    );
  }
  const message = messageParts.length > 0 ? messageParts.join('\n') : null;
  const contextParts = message ? [message] : [];
  if (brief) contextParts.push(renderBrief(brief));
  // A scope park (queue entry or per-candidate) is fixable in THIS session
  // with the user's confirmation — instruct the agent to offer, not to make
  // the human run the steps by hand. Agent-facing, so additionalContext only.
  if (
    parked.some((e) => isScopePark(e.lastError)) ||
    parkedCandidates.some((c) => isScopePark(c.reason ?? c.scope))
  ) {
    contextParts.push(renderScopeParkFixInstruction());
  }
  // Only instruct a drain when a claim would actually hand something out —
  // quiet-period entries (a possibly-live Codex session) don't count yet,
  // and a paused queue hands out nothing at all.
  if (!paused && queue.some((e) => drainEligible(e, now))) {
    contextParts.push(renderDrainInstruction());
  }
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
