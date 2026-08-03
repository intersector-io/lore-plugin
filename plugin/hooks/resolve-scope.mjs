#!/usr/bin/env node
/**
 * Scope-marker resolver CLI (docs/issues/0127): the librarian resolves a
 * candidate's scope from its source repo's own `.lore/scope.yml`, and this
 * wrapper is how it runs the SAME algorithm the session-end hook uses
 * (lib/scope-marker.mjs — nearest-marker-wins, `.git` boundary, malformed
 * handling) instead of re-implementing the walk ad hoc per run.
 *
 * Usage: node resolve-scope.mjs <directory>
 * Prints one JSON line: `{"scope": "...", "malformed": false}`, or `null`
 * when there is no marker (including anywhere outside a git repo). Always
 * exits 0 — an unreadable or absent directory is "no marker", not an error.
 */
import { resolveScopeMarker } from './lib/scope-marker.mjs';

console.log(JSON.stringify(resolveScopeMarker(process.argv[2] ?? null)));
process.exit(0);
