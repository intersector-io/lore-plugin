import type { Rule } from './types.js';
/**
 * Meta-schema: the shape of a Type Record (`type: type`), compiled into the
 * validation core rather than self-hosted (ADR-0002). Checks the
 * `x-lore-type` frontmatter block and the body's required sections,
 * including a fenced ```markdown template under "## Template".
 */
export declare const typeMetaSchema: Rule;
//# sourceMappingURL=typeMetaSchema.d.ts.map