/**
 * Wire DTOs shared by API responses and the portal SPA (2026-07-17 pure-
 * derivations-and-wire-dtos spec §B). These are the portable, JSON-serialized
 * shapes that `apps/indexer`/`apps/api` produce and `apps/portal` consumes over
 * HTTP — declared once so the two sides can't silently drift (the bug this
 * file replaces: `apps/portal/src/api.ts` had hand-copied a `SearchResultRow`
 * missing the `path` field the server actually sends).
 *
 * TYPE-ONLY: zero imports, zero runtime code. The portal build depends on this
 * staying dependency-free — never import anything into this file.
 */
export {};
//# sourceMappingURL=wire.js.map