#!/usr/bin/env node
/**
 * SessionStart hook (docs/issues/0123): probe the configured LORE_MCP_TOKEN
 * against the instance and say — loudly, with the exact remedy — when it is
 * the reason the lore MCP server will not connect this session. An expired
 * or terminal-inherited stale token otherwise presents as "the plugin's MCP
 * tools are broken" (the exact bug docs/issues/0114 fixed), and gets
 * debugged at the wrong layer.
 *
 * Silent on every state that is not a definite 401: healthy, unconfigured,
 * server unreachable. Network calls are bounded (~1.5s each) and every
 * failure mode is swallowed — this hook must never delay or fail a session
 * start (same posture as render-pending.mjs, which stays no-network; the
 * network is exactly why this is a separate hook).
 */
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { classifyTokenState } from './lib/token-probe.mjs';

async function whoamiStatus(base, token) {
  // AbortSignal.timeout over a hand-rolled controller: no timer handle of our
  // own to leak, which matters because an explicit process.exit() while libuv
  // handles are still closing trips a Windows assertion (observed live).
  try {
    const res = await fetch(`${base}/api/whoami`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(1500),
    });
    return res.status;
  } catch {
    return null;
  }
}

try {
  const url = process.env.LORE_MCP_URL;
  const envToken = process.env.LORE_MCP_TOKEN;
  const base = url ? url.replace(/\/mcp\/?$/, '') : null;

  let message = null;
  if (base && envToken) {
    const envStatus = await whoamiStatus(base, envToken);
    let fileToken = null;
    const tokenFile = path.join(process.env.LORE_HOME || path.join(homedir(), '.lore'), 'mcp-token.txt');
    if (existsSync(tokenFile)) fileToken = readFileSync(tokenFile, 'utf8').trim() || null;
    // Only probe the file token when the env one already failed — the healthy
    // path costs one request.
    const fileStatus =
      envStatus === 401 && fileToken !== null ? await whoamiStatus(base, fileToken) : null;
    message = classifyTokenState({
      envSet: true,
      envStatus,
      fileTokenSet: fileToken !== null,
      fileStatus,
      envEqualsFile: fileToken !== null && fileToken === envToken,
    });
  }

  if (message) {
    console.log(JSON.stringify({ systemMessage: `lore: ${message}` }));
  }
} catch {
  // Never fail a session start — and no explicit process.exit(): letting the
  // loop drain naturally exits 0 without racing handle teardown on Windows.
}
