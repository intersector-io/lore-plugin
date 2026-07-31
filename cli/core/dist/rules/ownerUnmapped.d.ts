import type { ConfigRule } from './types.js';
/**
 * `config/owner-unmapped` (docs/issues/0005, PRD.md §8.4 R22): every record
 * `x-lore.owners` entry should resolve against a value in the identity map
 * (`.lore/identities.yml`). Severity follows `.lore/config.yml` strictness —
 * warning by default (onboarding-friendly), error when `strictness: strict`.
 */
export declare const ownerUnmapped: ConfigRule;
//# sourceMappingURL=ownerUnmapped.d.ts.map