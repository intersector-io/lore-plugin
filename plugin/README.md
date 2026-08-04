# lore plugin

Installs the lore MCP server plus skills that make an agent search canonical
knowledge before deciding, author new records correctly the first time,
shepherd proposals to promotion, extract brownfield knowledge with the batch
discipline the harvester uses, walk an admin through a new deployment's
rollout, and answer questions about lore from its own docs — and two agents
(`librarian`, `conflict-checker`) plus the session capture hooks.

## Install

```sh
claude plugin marketplace add intersector-io/lore-plugin
claude plugin install lore@lore
```

Codex CLI installs from the same mirror (ADR-0014 amendment):

```sh
codex plugin marketplace add intersector-io/lore-plugin
codex plugin add lore@lore
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

Claude Code reads the manifest from `.claude-plugin/plugin.json`, Codex CLI
from `.codex-plugin/plugin.json` — **only** a manifest goes in either (the two
versions must match; `codex-structure.test.ts` enforces it). Everything else
stays at the plugin root:

- `skills/retrieval` — search lore before designing or deciding.
- `skills/authoring` — create, validate, and propose a new record.
- `skills/promotion` — track an open proposal to promotion or supersession.
- `skills/harvesting` — brownfield extraction: route whole-repo seeds to
  `lore-harvest`, run curated few-document extraction through the
  dedup-then-batch loop.
- `skills/guide` — answer questions about lore itself from its own docs.
- `skills/capture-pause` — pause/resume session capture on this machine via
  the `${LORE_HOME:-~/.lore}/capture-paused` marker; retrieval is unaffected.
- `skills/parked-captures` — retry or dismiss parked capture-queue entries on
  the user's ask; the agent runs `hooks/drain-queue.mjs`, never the human.
- `skills/onboarding` — drive an admin through finishing a fresh deployment's
  rollout.
- `agents/` — `librarian` (capture → dedupe → batch-propose) and
  `conflict-checker` (read-only gate against canon).
- `hooks/` — SessionEnd enqueues a capture; SessionStart renders what's pending.
- `.mcp.json` — the MCP server, keyed `lore`. Claude Code namespaces a
  plugin-bundled server's tools as `mcp__plugin_<plugin-name>_<server-key>__*`
  — here `mcp__plugin_lore_lore__*`, since both the plugin name and the
  server key are `lore` — never the bare `mcp__lore__*` form (that only
  applies to a non-plugin MCP client connecting to lore directly). The
  agents' `tools:` frontmatter must namespace under the plugin-scoped form,
  or Claude Code resolves none of their MCP tools (docs/issues/0114).
- `codex/` — the Codex-only glue (docs/issues/0054): `config.toml` (the
  `[mcp_servers.lore]` fragment), `hooks.json` (SessionStart + Stop — Codex
  has no SessionEnd, so the enqueue hook dedupes by session id), and
  `agents/*.toml`, **generated** from `agents/*.md` by
  `node scripts/generate-codex-agents.mjs` — edit the markdown, regenerate,
  never edit the TOML. Skills are shared, not copied: Codex reads the same
  `skills/*/SKILL.md` files.

`version` in the manifest is Claude Code's cache key for updates: bump it when
anything under `plugin/` changes, or installed users keep the cached copy.

The skills are intentionally thin: they teach tool sequencing, not catalog
content. The type catalog and the caller's proposable scopes come from `whoami`;
schemas, templates, and checklists from `create_record` / `validate_record` — all
fetched at runtime, so this plugin never needs a new release when the catalog
evolves.
