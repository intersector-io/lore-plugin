/**
 * Classification core for the SessionStart token probe (docs/issues/0123).
 * Pure — the hook script (hooks/token-probe.mjs) gathers the state (env var,
 * `${LORE_HOME:-~/.lore}/mcp-token.txt`, two whoami probes) and this decides
 * whether there is anything worth saying. Silent on healthy, unconfigured,
 * and unreachable states: only a definite 401 is actionable here, and an
 * expired token is the one failure that otherwise presents as "the plugin's
 * MCP tools are broken" three layers from its cause.
 */
export function classifyTokenState({ envSet, envStatus, fileTokenSet, fileStatus, envEqualsFile }) {
  if (!envSet) return null;
  if (envStatus !== 401) return null; // healthy (2xx), unreachable (null), or some other failure — not this problem

  if (fileTokenSet && fileStatus === 200 && !envEqualsFile) {
    return (
      'LORE_MCP_TOKEN in this session is STALE: a fresh, working token exists in mcp-token.txt ' +
      'but this terminal inherited an old environment (setx only reaches new terminal HOSTS). ' +
      'Exit ALL terminal windows completely (the terminal app itself, not just this tab), reopen, ' +
      'and restart Claude Code — the lore MCP server could not connect this session (HTTP 401).'
    );
  }
  if (fileTokenSet && fileStatus === 401) {
    return (
      'LORE_MCP_TOKEN is EXPIRED (server answers 401; local-auth session tokens live 12h). ' +
      'Run: node "%USERPROFILE%\\.lore\\refresh-mcp-token.mjs", then exit ALL terminal windows, ' +
      'reopen, and restart Claude Code — the lore MCP server could not connect this session.'
    );
  }
  return (
    'The lore server rejected LORE_MCP_TOKEN (HTTP 401), so the lore MCP server could not connect ' +
    'this session. Mint a fresh session token for the instance, set LORE_MCP_TOKEN, and restart ' +
    'from a NEW terminal host.'
  );
}
