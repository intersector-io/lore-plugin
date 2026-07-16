# lore — Claude Code plugin

[lore](https://lore.intersector.io) is a canonical knowledge base for agentic
teams: agents search and read canonical records and propose new ones; nothing
becomes canon until a human merges the pull request.

This repository distributes two things to licensed deployments:

- **`plugin/`** — the Claude Code plugin: the lore MCP server, its skills and
  agents, and the session capture hooks.
- **`template/`** — the starter scaffold for your canonical knowledge
  repository: the type catalog, config, grants, and CI validation workflow.

## Install the plugin

```sh
claude plugin marketplace add intersector-io/lore-plugin
claude plugin install lore@lore
```

Then point it at your deployment before starting a session:

```sh
export LORE_MCP_URL="https://lore.your-company.internal/mcp"
export LORE_MCP_TOKEN="<a bearer token for that endpoint>"
```

Both come from whoever operates your lore deployment. The full walkthrough —
scopes, where the token comes from, how to verify the connection — is served
by your deployment at `/docs/how-to/install-the-plugin/`.

## Start a canonical repository

Copy `template/` into a fresh git repository of your own and follow
`/docs/how-to/self-host-lore/` on your deployment.

---

This repository is **generated** from the private lore monorepo
(`scripts/sync-plugin-mirror.mjs`, ADR-0014). Don't send pull requests here —
they would be overwritten by the next sync. Report issues to your lore
contact.
