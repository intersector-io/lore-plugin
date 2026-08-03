# lore demo knowledge base

This is a presentable **demo seed** (docs/issues/0039) for trying lore locally.
It is a small, self-consistent canonical repository — the catalog Type Records
(`org/type/`) plus ~15 realistic sample records across the `org`,
`product:acme`, and `team:platform` scopes — so you can search, browse record
dossiers, walk typed links, and read non-empty knowledge-health dashboards
right after standing up a local instance.

It is derived from `template/` and, like the template, validates with zero
errors (this is checked in CI, so the demo can never drift out of validity):

```sh
node apps/cli/bin/lore.js validate demo
```

What the sample records deliberately demonstrate:

- **A supersedes chain** — "Store embeddings inline on the record row"
  (`superseded`) → "Store embeddings in a dedicated chunks table".
- **`implements` / `constrains` / `relates` links** connecting product work back
  to org-wide principles and standards — walk them on any record dossier.
- **Orphans** — the two glossary terms carry no typed links in either direction,
  so the health dashboard's orphan count is non-zero and real.
- **A grant** — `product:acme → team:platform` in `.lore/grants.yml`, so the
  portal grants viewer and the grant-value metric have something to show.

To run it, git-init a copy of this tree and point the compose stack's
`LORE_REPO_HOST_PATH` at it — the exact sequence is in the public docs
("Try lore locally" on the portal page) and `docs/deploy/runbook.md`. For a
shared evaluation instance, add `LORE_DEMO_MODE=1`: reading, search, and
dashboards work fully, while the admin surfaces (grants editing, git
configuration) render behind a "DEMO — read-only" plate and refuse mutations.

The record format, branch model, type catalog, and `.lore/` configuration are
identical to `template/` — read `template/README.md` for the full reference.
