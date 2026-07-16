# Canonical Repository Template

This is the canonical git repository for a Lore deployment: every durable
piece of organizational knowledge lives here as one typed markdown record.
Instantiate this template once per deployment (PRD.md §8.1 R1).

## Layout

```
org/{type}/{slug}.md              # organization-tier records (scope: org)
products/<product>/{type}/{slug}.md   # product-tier records (scope: product:<slug>)
teams/<team>/{type}/{slug}.md         # team-tier records (scope: team:<slug>)
org/type/{slug}.md                # the type catalog itself — Type Records
.lore/                            # non-record configuration (see below)
```

`{type}` must match a Type Record slug at `org/type/<type>.md` — every record's
`type` frontmatter field resolves to one. Scope is derived entirely from the
path (`org` / `products/<slug>` / `teams/<slug>`); it is never stored in
frontmatter.

## Branch model

- `main` — canonical. A record is canonical iff its file exists on `main`.
- `draft/**` — drafts. Indexed and searchable, but never canonical.
- Anything else is invisible to Lore — ordinary git work in flight.

Promotion is a pull request from a `draft/**` branch to `main` (PRD.md D1).
Merge to `main` *is* promotion — there is no separate status-flip step.

## Record format

Every record is one Markdown file with YAML frontmatter: the OKF-standard
layer (`type`, `title`, `description`, `tags`, `timestamp`) at the top level,
plus Lore's own fields under `x-lore` (`id`, `status`, `owners`, `links`,
`provenance`). Type-specific extra fields, if the type defines any, live
under `x-type`. See `CONTEXT.md` in the product repo for full vocabulary.

## The type catalog

`org/type/` holds one Type Record per type (`type: type`). Each Type Record
carries, under `x-lore-type`:

- `schema` — a JSON Schema (subset: `type`/`required`/`properties`/`enum`/
  `items`/`format: date`) for that type's `x-type` extras.
- `required-sections` — the H2 headings every record of that type must have.
- `classification-test` — the yes/no criterion for "does this content
  qualify as this type?"

The body of a Type Record additionally carries an authoring template (in a
fenced `` ```markdown `` block under "## Template"), a worked example, and a
reviewer checklist. The *shape* a Type Record itself must have (the
meta-schema) is compiled into `@lore/core`, not read from this content —
`org/type/type.md` documents it for humans but is descriptive only
(docs/adr/0002-meta-schema-in-code.md).

Extend the catalog by adding a new Type Record through the normal PR gate.

## `.lore/` configuration

- `config.yml` — the STS claim used as canonical identity, identity-map
  strictness.
- `identities.yml` — git-host handle -> corporate identity map.
- `grants.yml` — scope->scope namespace read grants.

Validated for referential sanity by `lore validate` alongside every record.

## Review routing (`CODEOWNERS`)

`CODEOWNERS` at the repo root routes PR review by the same scope/type
convention every other Lore config uses (PRD.md R24: "CODEOWNERS routes
reviews by scope/type"). It is host configuration, not a record — it is
never inside `org/`, `products/<slug>/`, or `teams/<slug>/`, so discovery
skips it and `lore validate` never inspects it; the "self-certifying" CI
gate (`lore validate .` with zero errors, docs/adr/0002) is unaffected by
its presence.

The routing rule mirrors the layout: `org/type/**` and `.lore/**` (the
platform-level surfaces — what counts as a valid type, and the deployment's
own identity/grant config) go to `@platform-maintainers`; the rest of
`org/**` goes to `@architecture`; each `products/<slug>/**` and
`teams/<slug>/**` gets its own placeholder alias (`@product-<slug>-team`,
`@team-<slug>`) so a new product or team adds one line, not a redesign.
GitHub/GitLab CODEOWNERS syntax resolves overlapping patterns
last-match-wins, so the more specific `org/type/**`/`.lore/**` lines are
ordered after the general `org/**` line in the shipped file.

Update `CODEOWNERS` whenever a product or team directory is added under
`products/` or `teams/` — an unowned path still routes review (falls
through to whatever broader pattern matches, or to no required reviewer at
all if none does), so a missing line is a silent review gap, not an error
`lore validate` will catch.

## Validating this repository

```
lore validate .
```

This repository is self-certifying: it must pass its own `lore validate`
with zero errors (the Main Invariant, docs/adr/0002). CI runs the fast path
(changed files only) on ordinary-record PRs, and full-repo validation on any
PR touching a Type Record or `.lore/` config.
