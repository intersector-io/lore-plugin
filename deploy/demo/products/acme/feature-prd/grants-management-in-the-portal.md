---
type: feature-prd
title: "Grants management in the portal"
description: "Admins edit scope grants in the portal, which opens a reviewed pull request against .lore/grants.yml."
tags: [product:acme, portal]
generated: { by: "human:renato@example.com", at: 2026-05-11T09:00:00.000Z }
x-lore:
  id: 01KRB47GM0A3VYDD39TDQS2Y29
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [01KQHC8AM0CW96WS3WV6K3ZMD4], constrains: [], relates: [01KQS3EFM0RCFDM2GJ8K08JMTR] }
  provenance: { source: authored }
---

Admins need to share one scope's records with another without hand-editing
YAML in a checkout. This feature adds a grants editor to the portal: it shows
current grants as directional `from → to` pairs, validates edits in the shared
core, and opens a pull request against `.lore/grants.yml`.

Crucially, it never writes to `main` — every grant change stays on the same
reviewed PR gate as any other configuration change, preserving the audit trail.
