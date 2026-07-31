import type { ConfigRule } from './types.js';
/**
 * `config/grant-scope` (docs/issues/0005, PRD.md §8.8 R35): every grant's
 * `from`/`to` must be a well-formed scope — `org`, `product:<slug>`, or
 * `team:<slug>` (CONTEXT.md "Scope"). Runs only over entries that already
 * passed the basic `{ from, to }` shape check in `config/parse` — a
 * schema-malformed entry is that rule's error, not this one's, so the two
 * fixtures (malformed YAML vs. malformed scope) report under distinct ids.
 */
export declare const grantScope: ConfigRule;
//# sourceMappingURL=grantScope.d.ts.map