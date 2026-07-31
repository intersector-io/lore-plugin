import { parseConfigYml, parseIdentitiesYml } from './loreConfigParse.js';
import { isNonEmptyString, readField } from './fieldHelpers.js';
/**
 * `config/owner-unmapped` (docs/issues/0005, PRD.md §8.4 R22): every record
 * `x-lore.owners` entry should resolve against a value in the identity map
 * (`.lore/identities.yml`). Severity follows `.lore/config.yml` strictness —
 * warning by default (onboarding-friendly), error when `strictness: strict`.
 */
export const ownerUnmapped = {
    name: 'config/owner-unmapped',
    check(ctx) {
        const { strictness } = parseConfigYml(ctx.configRaw);
        const { values: mappedIdentities } = parseIdentitiesYml(ctx.identitiesRaw);
        const severity = strictness === 'strict' ? 'error' : 'warning';
        const diagnostics = [];
        for (const f of ctx.files) {
            const owners = readField(f.frontmatter, ['x-lore', 'owners']);
            if (!Array.isArray(owners))
                continue;
            owners.forEach((owner, index) => {
                if (!isNonEmptyString(owner))
                    return;
                if (mappedIdentities.has(owner))
                    return;
                diagnostics.push({
                    rule: 'config/owner-unmapped',
                    severity,
                    file: f.file,
                    pointer: `/x-lore/owners/${index}`,
                    message: `\`x-lore.owners\` entry "${owner}" does not resolve against any value in .lore/identities.yml.`,
                });
            });
        }
        diagnostics.sort((a, b) => a.file.localeCompare(b.file) || a.pointer.localeCompare(b.pointer));
        return diagnostics;
    },
};
//# sourceMappingURL=ownerUnmapped.js.map