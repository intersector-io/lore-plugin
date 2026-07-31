import { parseGrantsYml, isWellFormedScope, GRANTS_FILE } from './loreConfigParse.js';
/**
 * `config/grant-scope` (docs/issues/0005, PRD.md §8.8 R35): every grant's
 * `from`/`to` must be a well-formed scope — `org`, `product:<slug>`, or
 * `team:<slug>` (CONTEXT.md "Scope"). Runs only over entries that already
 * passed the basic `{ from, to }` shape check in `config/parse` — a
 * schema-malformed entry is that rule's error, not this one's, so the two
 * fixtures (malformed YAML vs. malformed scope) report under distinct ids.
 */
export const grantScope = {
    name: 'config/grant-scope',
    check(ctx) {
        const { entries } = parseGrantsYml(ctx.grantsRaw);
        const diagnostics = [];
        for (const { from, to, index } of entries) {
            if (!isWellFormedScope(from)) {
                diagnostics.push({
                    rule: 'config/grant-scope',
                    severity: 'error',
                    file: GRANTS_FILE,
                    pointer: `/grants/${index}/from`,
                    message: `Grant \`from\` scope "${from}" is not well-formed: expected "org", "product:<slug>", or "team:<slug>".`,
                });
            }
            if (!isWellFormedScope(to)) {
                diagnostics.push({
                    rule: 'config/grant-scope',
                    severity: 'error',
                    file: GRANTS_FILE,
                    pointer: `/grants/${index}/to`,
                    message: `Grant \`to\` scope "${to}" is not well-formed: expected "org", "product:<slug>", or "team:<slug>".`,
                });
            }
        }
        return diagnostics;
    },
};
//# sourceMappingURL=grantScope.js.map