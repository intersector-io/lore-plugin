import type { ConfigRule } from './types.js';
/**
 * `config/parse` (docs/issues/0005-secret-lint-config-sanity.md): the three
 * `.lore/` files must each be valid YAML matching their basic shape —
 * `config.yml`'s `claim`/`strictness` enum values, `identities.yml`'s
 * handle->identity mapping, `grants.yml`'s top-level `grants:` list of
 * `{ from, to }` mappings. Scope well-formedness of `from`/`to` values is
 * `config/grant-scope`'s concern, not this rule's.
 */
export declare const configParse: ConfigRule;
//# sourceMappingURL=configParse.d.ts.map