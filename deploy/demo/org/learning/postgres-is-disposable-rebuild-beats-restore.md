---
type: learning
title: "Postgres is disposable — rebuild beats restore"
description: "Recovering the index from git is faster and more trustworthy than restoring a database backup."
tags: [org, ops]
generated: { by: "human:renato@example.com", at: 2026-05-07T09:00:00.000Z }
x-lore:
  id: 01KR0TMMM0F2HA9DECNG63VZPH
  status: active
  owners: [renato@example.com]
  links: { supersedes: [], implements: [], constrains: [], relates: [01KQY87XM0E4DVAFN243A9032J] }
  provenance: { source: authored }
---

During a staging incident we lost the Postgres volume. Restoring the most
recent dump would have taken a backup we did not have and left us unsure the
index matched `main`.

Instead we re-migrated and re-indexed from the repo in minutes, guaranteed
consistent with the current `main`. The lesson: back up the git repository,
treat Postgres as a cache, and rehearse `rebuild` — not `restore`.
