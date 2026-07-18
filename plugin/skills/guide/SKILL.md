---
name: guide
description: |
  Answer questions about Lore itself — what it is, how a concept works (scopes, types,
  records, proposals, promotion, the review gate), how to do something with it, or why
  a tool call was refused. Use when the user asks "what is lore", "how does X work in
  lore", "what's the difference between a scope and a type", "why can't I propose
  here", or any question about the product rather than the knowledge stored in it.
  For "what does Lore say about X" — searching the knowledge — use retrieval instead.
---

# Guide

Lore ships its own manual: a docs site served by the same server this plugin
is connected to, with an agent-readable index. This skill is a router, not a
copy of that manual — never answer a question about Lore from memory or from
what other skills happen to mention. Fetch the page that answers it, then
answer from what you fetched, citing the page URL.

## Finding the docs

The docs are served under `/docs` on the same origin as the MCP server:
take `LORE_MCP_URL` (the URL this plugin's server is configured with), keep
only its origin, and append `/docs`. Then fetch:

1. `<docs>/llms.txt` — the index: every page with a one-line description.
   Always fetch this first and pick the page(s) that match the question;
   never guess a page URL.
2. The page URL itself for the full answer. Getting-started, concepts,
   how-to guides, scenarios, and an FAQ all live there.

Fetch with WebFetch; if that fails, try `curl` (local and private-network
hosts often need it) before concluding the docs are unreachable. If they
truly are (no build deployed, network gate), say so plainly, then answer
only from this instance's live tools — `whoami` for what exists here, the
retrieval skill if the knowledge base itself documents the answer — and
leave anything you can't source that way unanswered.

## Product question vs knowledge question

The one routing decision that goes wrong: "what does Lore say about our
retry policy?" is not a question about Lore — it's a search of the
knowledge base. Route by what the answer would cite:

| The user asks about | Route |
| --- | --- |
| What Lore is, a concept (scope, type, record, proposal, canon, promotion), how a workflow works, self-hosting, install | Docs, via `llms.txt` |
| What the org has decided / documented — "what does Lore say about X", "has this been decided" | The **retrieval** skill (`search_knowledge`) |
| What *this* user can see or author, which types and scopes exist here | `whoami` — live truth for this instance, never the docs |
| The state of a specific proposal, or changing existing canon | The **promotion** skill (`get_proposal`) |
| Actually writing a new record, once a question turns into a task | The **authoring** skill |

## Explaining a refusal or failure

When the user asks why something was refused, the answer is in the error
plus this instance's live state — the docs only explain the vocabulary:

1. Read the error name the tool returned (e.g. a 403 names its gate; a
   validation failure returns structured diagnostics naming each rule). If
   the exact error isn't in the conversation, ask for it — don't guess
   which gate fired.
2. Call `whoami` to see what this identity actually holds — most "why can't
   I" answers are visible there (a scope not held, a role not granted).
3. Only then reach for the docs (FAQ, concepts) to explain what the gate
   *is*, citing the page.

Never guess at an instance's configuration — grants, roles, and toggles
vary per deployment, and the docs deliberately don't know them.

## When the question becomes a task

Answering "how do I record a decision?" ends with the docs' answer plus an
offer to do it — and doing it means switching to the authoring skill's loop
(likewise retrieval for searching, promotion for shepherding), never
paraphrasing it from here. This skill ends where a tool call that changes
anything begins.
