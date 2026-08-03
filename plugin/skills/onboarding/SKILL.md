---
name: onboarding
description: |
  Drive an admin through finishing a fresh Lore deployment's rollout, live against the
  instance: verify the connection and who the admin actually is, confirm identity/SSO
  claims resolved into the expected scopes and roles, write per-team permissions into
  the access matrix, seed the org-scope starter set, and run one record end to end
  through review. Use when an operator or admin asks to "finish setting up lore",
  "configure teams/permissions", "set up the access matrix", "onboard the
  organization", or "seed the first records". The server-side half — the canonical
  repo, Docker, the setup wizard, the SSO realm, webhooks — is not doable from here:
  route those to the docs via the guide skill.
---

# Onboarding

The docs page "Onboard your organization" is the map for a multi-team
rollout; this skill is the part of that map an agent can *drive* rather than
describe: everything after the server is up and this plugin is connected.
Work the steps in order, verifying each against the live instance instead of
assuming the docs were followed. Ask the human for the facts only they
have — team names, who leads each team, principal ids — and never invent any
of those. Fetch the docs page (via the guide skill) when you need its
detail — the permission recipe, the starter set, the finished-rollout
checklist — or when routing a failure; the steps below carry only the
sequencing.

## Step 1 — Verify who's really there

Call `whoami` before anything else, and read the failure honestly: a
connection error or 401 is the plugin's URL/token (route to the docs'
install page), and `isAdmin: false` puts step 2 out of reach — say which is
wrong rather than continuing as if it weren't (the docs own how the admin
role is granted in each auth mode).

Then have at least one **regular member** run `whoami` too. Admins bypass
the access matrix, so an admin's clean view proves authentication works but
says nothing about what everyone else will get. The two claim failures that
dominate real rollouts show up right here — a member whose scopes collapse
to `org` alone, or whose `canPropose` is false, has an identity-mapping
problem on the server side: name it and route to the self-hosting docs'
identity section; nothing in this skill can fix it.

## Step 2 — Per-team permissions (admin only)

Ask the human for the shape first: which team scopes exist, who leads each,
and the principal ids involved (the `id` each person's own `whoami`
returns — never guess ids). Then:

1. `get_authorization` — read the current matrix, and always edit from what
   it returns, because `set_authorization` replaces the whole thing.
2. Apply the docs page's multi-team recipe (fetch it — don't improvise a
   permission model) with the human's names filled in.
3. `set_authorization`, then verify the way step 1 did: a member's own
   `whoami` should now show their team under `contribute`, and their lead's
   under `approve`. A scope granted before its first record exists is fine —
   that is the normal order here.

## Step 3 — Seed the org starter set

Don't launch over an empty knowledge base — and don't blindly seed either:

1. `list_records` filtered to `org` scope first. If starter records already
   exist, the job is review, not re-creation.
2. Author what's missing through the authoring skill's loop — it, not this
   skill, owns how a record is created, validated, and proposed. *What* to
   seed comes from the docs (Getting started's org starter set): the org's
   profile, its durable principles, one record per product — matched to
   slugs from `whoami`'s type catalog, never from memory. Reuse one
   `create_record` template per type across the batch.
3. Bulk import of existing repos and wikis belongs to the harvester (the
   harvesting skill), scoped per team and dry-run first — not to a loop of
   hand-authored proposals.

Seeding produces **proposals, not canon**. Tell the human where review
happens (the portal) and who holds approve for each batch.

Alongside seeding, have each team bind its working repositories to their
scope: one committed `.lore/scope.yml` per repo (`scope: team:<slug>` or
`product:<slug>` — ADR-0023), a one-line PR reviewed by the repo's own
owners. That marker is what makes every later capture and authoring session
land in the right scope deterministically instead of by per-session
inference — at rollout scale, skipping it is how misplaced proposals flood
reviewers.

## Step 4 — One record end to end

Before declaring the rollout done, run a single record through the entire
pipe deliberately, because it exercises everything the steps above set up:

1. An engineer (or this agent) authors and proposes a record into a **team**
   scope — proving contribute grants.
2. That team's lead approves it in the portal. When they say it's decided,
   call `get_proposal` once on the returned ref — don't poll a human gate.
3. `search_knowledge` finds the record as canonical — proving the index
   follows promotion.

If a leg fails, the failure names what was skipped: a 403 on propose is the
matrix (step 2); a promoted record missing from search is server-side
indexing (route to the docs). Close by reporting against the docs page's own
finished-rollout checklist — an unchecked box with a named owner beats a
premature "setup complete".
