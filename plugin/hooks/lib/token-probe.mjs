/**
 * Classification core for the SessionStart token probe (docs/issues/0123).
 * Pure — the hook script (hooks/token-probe.mjs) gathers the state (env var,
 * `${LORE_HOME:-~/.lore}/mcp-token.txt`, the instance's auth mode, two whoami
 * probes) and this decides whether there is anything worth saying. Silent on
 * healthy, unconfigured, and unreachable states: only a definite 401 is
 * actionable here, and an expired token is the one failure that otherwise
 * presents as "the plugin's MCP tools are broken" three layers from its cause.
 *
 * The remedy is mode-specific: only local-auth deployments mint their own
 * long-lived MCP tokens, so `authMode` gates that advice — an OIDC instance's
 * `POST /api/auth/token` is a 404 and its tokens come from the IdP, short-lived
 * by design (the most likely real-world 401). When the mode is unknown (the
 * probe couldn't reach `/api/auth/mode`) the message stays mode-neutral.
 */

// The one spelling of the local-auth remedy — the portal path and endpoint
// must never drift between the branches that emit it.
const LOCAL_MINT_HINT =
  'Mint a long-lived MCP token — sign in to the portal and use the MCP token card on the ' +
  'dashboard, or POST /api/auth/token with a fresh login token — set LORE_MCP_TOKEN wherever ' +
  'it is defined (shell profile / environment / secret manager), and restart Claude Code from ' +
  'a NEW terminal';

/** The mode-appropriate way to obtain a fresh credential, appended after the state description. */
function remedyFor(authMode) {
  if (authMode === 'local') return `${LOCAL_MINT_HINT}; local-auth MCP tokens live ~180 days, so this should not recur.`;
  if (authMode === 'oidc')
    return (
      'Get a fresh token from your identity provider (its tokens are short-lived by design), set ' +
      'LORE_MCP_TOKEN wherever it is defined, and restart Claude Code from a NEW terminal.'
    );
  return 'Obtain a fresh token for the instance, set LORE_MCP_TOKEN wherever it is defined, and restart Claude Code from a NEW terminal.';
}

export function classifyTokenState({ envSet, envStatus, fileTokenSet, fileStatus, envEqualsFile, authMode = null }) {
  if (!envSet) return null;
  if (envStatus !== 401) return null; // healthy (2xx), unreachable (null), or some other failure — not this problem

  if (fileTokenSet && fileStatus === 200 && !envEqualsFile) {
    return (
      'LORE_MCP_TOKEN in this session is STALE: a fresh, working token exists in mcp-token.txt ' +
      'but this terminal inherited an old environment. Exit ALL terminal windows completely ' +
      '(the terminal app itself, not just this tab), reopen, and restart Claude Code so the new ' +
      'value is inherited (on Windows, setx only reaches NEW terminal hosts) — the lore MCP server ' +
      'could not connect this session (HTTP 401).'
    );
  }
  if (fileTokenSet && fileStatus === 401) {
    return `LORE_MCP_TOKEN is EXPIRED (server answers 401). ${remedyFor(authMode)}`;
  }
  return (
    'The lore server rejected LORE_MCP_TOKEN (HTTP 401), so the lore MCP server could not connect ' +
    `this session. ${remedyFor(authMode)}`
  );
}
