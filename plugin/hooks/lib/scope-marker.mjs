/**
 * Scope marker resolution (ADR-0023): a working repo binds itself to a scope
 * via a committed `.lore/scope.yml` with a single `scope:` key. Resolution is
 * nearest-marker-wins walking up from the starting directory — but a marker
 * only counts inside a git repository (the ADR's "a working repository or any
 * subdirectory of one"): the walk keeps going until it sees a `.git`, and
 * without one by the filesystem root the answer is "no marker", however many
 * `.lore/scope.yml` files the chain contains. That boundary is load-bearing:
 * `${LORE_HOME:-~/.lore}` puts a `.lore/` directory in most home dirs, and an
 * un-reviewed personal file there must never scope every non-repo session.
 *
 * `org` is not valid in a marker, and a found-but-unparseable marker resolves
 * to `{scope: null, malformed: true}` rather than walking further — the
 * consumer announces the fallback to inference and can name the broken file;
 * it never guesses a fix.
 *
 * The scope shape mirrors @lore/core's SCOPE_PATTERN minus `org`
 * (packages/core/src/rules/loreConfigParse.ts) — restated here because the
 * plugin ships standalone through the mirror and its hooks are
 * dependency-free by design.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const MARKER_SCOPE = /^scope:\s*(["']?)((?:product|team):[a-z0-9][a-z0-9-]*)\1\s*$/m;
// A session-end hook must never stall on a pathological file; anything past
// this is not a one-key YAML and parses as malformed without being read.
const MARKER_MAX_BYTES = 64 * 1024;

function parseMarker(file) {
  try {
    if (statSync(file).size > MARKER_MAX_BYTES) return null;
    const text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    const match = MARKER_SCOPE.exec(text);
    return match ? match[2] : null;
  } catch {
    return null;
  }
}

/**
 * @returns `{scope, malformed}` for the nearest marker inside a git repo
 * (`scope` null + `malformed` true when the file exists but doesn't parse),
 * or null when there is no marker — including anywhere outside a git repo.
 */
export function resolveScopeMarker(startDir) {
  if (typeof startDir !== 'string' || startDir.length === 0) return null;
  let dir = path.resolve(startDir);
  let nearest = null;
  for (;;) {
    if (nearest === null) {
      const marker = path.join(dir, '.lore', 'scope.yml');
      if (existsSync(marker)) {
        const scope = parseMarker(marker);
        nearest = { scope, malformed: scope === null };
      }
    }
    if (existsSync(path.join(dir, '.git'))) return nearest;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
