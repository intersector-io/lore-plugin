import type { Diagnostic } from '../types.js';
import type { ConfigRule } from './types.js';
/**
 * `config/grant-self` (docs/issues/0036): a grant whose `from` equals its `to`
 * is meaningless — a scope already reads its own records (CONTEXT.md "Grant"),
 * so a self-grant is almost always an editing mistake. Runs over entries that
 * already passed the `{ from, to }` shape check in `config/parse`.
 */
export declare const grantSelf: ConfigRule;
/**
 * `config/grant-duplicate` (docs/issues/0036): two grants with the same
 * `(from, to)` pair are redundant. The first occurrence is kept clean; every
 * later duplicate is flagged, pointing back at the index it repeats.
 */
export declare const grantDuplicate: ConfigRule;
/**
 * A directional scope grant: `from`'s canonical records become readable to
 * principals holding `to` (CONTEXT.md "Grant"). The `.lore/grants.yml` list is
 * an ordered array of these.
 */
export interface GrantPair {
    from: string;
    to: string;
}
/**
 * Serializes a grant set to `.lore/grants.yml` text (docs/issues/0036),
 * preserving the template's commented header so a UI-driven rewrite is
 * indistinguishable in shape from a hand-authored file. An empty set renders
 * `grants: []` exactly as the template ships it.
 */
export declare function serializeGrantsYml(grants: GrantPair[]): string;
/**
 * Validates `.lore/grants.yml` text as a standalone unit (docs/issues/0036,
 * ADR-0002): the same rules `validateRepo` runs over the file in CI —
 * `config/parse` (YAML/shape), `config/grant-scope` (well-formed scopes),
 * `config/grant-self`, `config/grant-duplicate` — composed so the config→PR
 * service can reject an invalid grant set before any git action, emitting the
 * identical frozen diagnostics. Returns every diagnostic (errors and any
 * warnings); the caller decides what blocks.
 */
export declare function validateGrantsYml(raw: string | undefined): Diagnostic[];
//# sourceMappingURL=grantsIntegrity.d.ts.map