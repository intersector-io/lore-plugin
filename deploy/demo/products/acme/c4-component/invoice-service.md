---
type: c4-component
title: "Invoice Service"
description: "Builds invoices from usage and settles them on a successful charge."
tags: [product]
generated: { by: "human:renato@example.com", at: 2026-07-15T12:00:00.000Z }
x-lore:
  id: 01J6R3JP98XZPFEW4Z296NST3H
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [] }
  provenance: { source: authored }
x-type:
  technology: "TypeScript module"
  container: 011Q6S8NMYMAFSN2NEVZJ7DM95
---

## Responsibility

Builds invoices from metered usage records and marks them settled once the
associated charge succeeds, inside the Billing API container.
