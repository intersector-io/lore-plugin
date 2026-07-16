# lore plugin

Installs the lore MCP server plus three skills that make an agent search
canonical knowledge before deciding, author new records correctly the first
time, and shepherd proposals to promotion — and two agents (`librarian`,
`conflict-checker`) plus the session capture hooks.

## Install

```sh
claude plugin marketplace add intersector-io/lore-plugin
claude plugin install lore@lore
```

`intersector-io/lore-plugin` is a public mirror generated from this directory
(ADR-0014).

Then set `LORE_MCP_URL` and `LORE_MCP_TOKEN`. The full walkthrough — scopes,
where the URL and token come from, how to verify the connection — is the
canonical one, in `apps/docs/src/content/docs/how-to/install-the-plugin.md`
(served by a running instance at `/docs/how-to/install-the-plugin/`). Keep it
there, not here.

To develop on the plugin itself, skip the marketplace and point a session at
this directory: `claude --plugin-dir ./plugin`.

## Env-substitution convention

`.mcp.json` uses `${VAR}` / `${VAR:-default}` placeholders, resolved by
Claude Code at session start from the process environment. Nothing in this
plugin hardcodes a tenant endpoint or credential — every deployment supplies
its own via environment variables. Don't commit real URLs or tokens into
`.mcp.json`; the placeholder form is the only form that belongs in git.

The capture hooks keep their queue under `${LORE_HOME:-~/.lore}`.

## Layout

Claude Code reads the manifest from `.claude-plugin/plugin.json` — **only** the
manifest goes in there. Everything else stays at the plugin root:

- `skills/retrieval` — search lore before designing or deciding.
- `skills/authoring` — create, validate, and propose a new record.
- `skills/promotion` — track an open proposal to promotion or supersession.
- `agents/` — `librarian` (capture → dedupe → batch-propose) and
  `conflict-checker` (read-only gate against canon).
- `hooks/` — SessionEnd enqueues a capture; SessionStart renders what's pending.
- `.mcp.json` — the MCP server. Its key (`lore`) is what the agents' tool refs
  namespace under (`mcp__lore__*`); the two must agree.

`version` in the manifest is Claude Code's cache key for updates: bump it when
anything under `plugin/` changes, or installed users keep the cached copy.

All three skills are intentionally thin: they teach tool sequencing, not catalog
content. The type catalog and the caller's proposable scopes come from `whoami`;
schemas, templates, and checklists from `create_record` / `validate_record` — all
fetched at runtime, so this plugin never needs a new release when the catalog
evolves.
