import { parseGrantsYml, GRANTS_FILE } from './loreConfigParse.js';
import { grantScope } from './grantScope.js';
/**
 * `config/grant-self` (docs/issues/0036): a grant whose `from` equals its `to`
 * is meaningless — a scope already reads its own records (CONTEXT.md "Grant"),
 * so a self-grant is almost always an editing mistake. Runs over entries that
 * already passed the `{ from, to }` shape check in `config/parse`.
 */
export const grantSelf = {
    name: 'config/grant-self',
    check(ctx) {
        const { entries } = parseGrantsYml(ctx.grantsRaw);
        return entries
            .filter((entry) => entry.from === entry.to)
            .map((entry) => ({
            rule: 'config/grant-self',
            severity: 'error',
            file: GRANTS_FILE,
            pointer: `/grants/${entry.index}`,
            message: `Grant ${entry.index} is a self-grant: \`from\` and \`to\` are both "${entry.from}". A scope already reads its own records.`,
        }));
    },
};
/**
 * `config/grant-duplicate` (docs/issues/0036): two grants with the same
 * `(from, to)` pair are redundant. The first occurrence is kept clean; every
 * later duplicate is flagged, pointing back at the index it repeats.
 */
export const grantDuplicate = {
    name: 'config/grant-duplicate',
    check(ctx) {
        const { entries } = parseGrantsYml(ctx.grantsRaw);
        const firstSeenAt = new Map();
        const diagnostics = [];
        for (const entry of entries) {
            const key = `${entry.from} ${entry.to}`;
            const seen = firstSeenAt.get(key);
            if (seen === undefined) {
                firstSeenAt.set(key, entry.index);
                continue;
            }
            diagnostics.push({
                rule: 'config/grant-duplicate',
                severity: 'error',
                file: GRANTS_FILE,
                pointer: `/grants/${entry.index}`,
                message: `Grant ${entry.index} duplicates the "${entry.from}" → "${entry.to}" grant already declared at index ${seen}.`,
            });
        }
        return diagnostics;
    },
};
/** The commented header carried by `template/.lore/grants.yml`, preserved on every serialized rewrite so the file keeps its self-documenting shape. */
const GRANTS_HEADER = `# Scope grants (CONTEXT.md "Grant", PRD.md §8.8 R35): make one scope's
# canonical records readable to principals holding another scope. Scope-level
# only — no per-record grants. Grants never include drafts.
#
# Example: let team:platform read everything under product:acme
#
# grants:
#   - from: product:acme
#     to: team:platform`;
/**
 * Serializes a grant set to `.lore/grants.yml` text (docs/issues/0036),
 * preserving the template's commented header so a UI-driven rewrite is
 * indistinguishable in shape from a hand-authored file. An empty set renders
 * `grants: []` exactly as the template ships it.
 */
export function serializeGrantsYml(grants) {
    if (grants.length === 0) {
        return `${GRANTS_HEADER}\n\ngrants: []\n`;
    }
    const body = grants.map((g) => `  - from: ${g.from}\n    to: ${g.to}`).join('\n');
    return `${GRANTS_HEADER}\n\ngrants:\n${body}\n`;
}
/**
 * Validates `.lore/grants.yml` text as a standalone unit (docs/issues/0036,
 * ADR-0002): the same rules `validateRepo` runs over the file in CI —
 * `config/parse` (YAML/shape), `config/grant-scope` (well-formed scopes),
 * `config/grant-self`, `config/grant-duplicate` — composed so the config→PR
 * service can reject an invalid grant set before any git action, emitting the
 * identical frozen diagnostics. Returns every diagnostic (errors and any
 * warnings); the caller decides what blocks.
 */
export function validateGrantsYml(raw) {
    const ctx = { grantsRaw: raw, files: [] };
    const { errors } = parseGrantsYml(raw);
    return [...errors, ...[grantScope, grantSelf, grantDuplicate].flatMap((rule) => rule.check(ctx))];
}
//# sourceMappingURL=grantsIntegrity.js.map