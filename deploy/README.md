# lore — licensed deployment bundle

This is everything you need to run a **lore** server without any access to the
product source. The API and indexer ship as container images pulled from a
private registry; **your pull credential is the license** (ADR-0014). Nothing
here is built from source — there is no monorepo to clone.

You get two things from lore:

- **This bundle** (`deploy/` in the `intersector-io/lore-plugin` mirror) — the
  compose file and env samples below.
- **Registry credentials** — a per-customer username + token that can *pull*
  the `lore-api` and `lore-indexer` images. Issued and tracked per the
  licensing process; renew at contract renewal.

The Claude Code plugin and the `template/` canon scaffold come from the same
public mirror — see "Start your canonical repository" below.

## 1. Log in to the registry

```sh
docker login "$LORE_IMAGE_REGISTRY" -u <your-customer-username> -p <your-pull-token>
```

`LORE_IMAGE_REGISTRY` is the registry host lore gave you (e.g.
`registry.example.com`). Export it — the compose file reads it and fails loudly
if it's unset:

```sh
export LORE_IMAGE_REGISTRY=registry.example.com
export LORE_IMAGE_TAG=latest   # or a pinned version lore gave you
```

You can put both in a `.env` file beside `docker-compose.yml` instead; compose
loads it automatically.

## 2. Fill in the env files

```sh
cp env/api.env.example env/api.env
cp env/indexer.env.example env/indexer.env
```

Open `env/api.env`. Every variable is documented inline. For a self-serve
install with built-in local auth you only need a few:

```dotenv
LORE_REPO_PATH=/repo
LORE_AUTH_MODE=local
LORE_EMBEDDING_PROVIDER=fake:default
```

For OIDC instead, leave `LORE_AUTH_MODE` unset and fill in `LORE_STS_ISSUER` /
`LORE_STS_AUDIENCE`. Leave the git variables unset — the portal's setup wizard
fills them in.

Point compose at your paths and the env files with a `.env` beside the compose
file:

```dotenv
LORE_REPO_HOST_PATH=./repo
LORE_API_ENV_FILE=env/api.env
LORE_INDEXER_ENV_FILE=env/indexer.env
```

`LORE_REPO_HOST_PATH` is where this deployment's clone of your canonical repo
lives on the host. For a self-serve install it must start **empty** — the
wizard clones into it and refuses to overwrite a non-empty checkout:

```sh
mkdir -p repo
```

## 3. Bring the stack up

```sh
docker compose config -q                                    # validate first
docker compose up -d --wait db                              # Postgres + pgvector
docker compose --profile indexer run --rm indexer migrate   # schema
docker compose up -d api                                    # API, portal, docs, MCP
```

Confirm it's alive:

```sh
curl -f http://localhost:3300/ready
```

With no git config yet, the API is in **setup mode**: open
`http://localhost:3300/portal/` and finish setup in the first-run wizard
(create the admin account, connect your git remote, set the webhook secret,
build the first index). The wizard's rebuild indexes your canon; there is
nothing else to run.

**Headless variant** — if you set the git stack in `env/api.env` instead of
using the wizard, clone your canonical repo into `LORE_REPO_HOST_PATH` yourself
and build the first index before starting the API:

```sh
docker compose --profile indexer run --rm indexer rebuild --ref main
```

## 4. Read the docs on your running instance

Once the API is up, the full operator and developer documentation is served by
the container itself at **`http://localhost:3300/docs/`** — self-hosting,
security, the plugin install walkthrough, and the day-two upgrade/recovery
sequence all live there. Start with `/docs/how-to/self-host-lore/`.

## Upgrade

Pull the new images and re-run migrate + rebuild — the only upgrade path:

```sh
docker compose pull
docker compose --profile indexer run --rm indexer migrate
docker compose --profile indexer run --rm indexer rebuild --ref main
docker compose up -d api
```

## Start your canonical repository

lore needs an ordinary git repo of your own for canon. Copy the `template/`
scaffold from the same `intersector-io/lore-plugin` mirror this bundle rides in
into a fresh repository, then follow `/docs/how-to/self-host-lore/` on your
running instance. Install the Claude Code plugin from that mirror too:

```sh
claude plugin marketplace add intersector-io/lore-plugin
claude plugin install lore@lore
```
