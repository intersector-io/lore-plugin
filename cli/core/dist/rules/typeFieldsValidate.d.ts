import type { RepoRule } from './types.js';
/**
 * Per-type field validation (docs/issues/0003-type-records-catalog.md):
 * required body sections and the `x-type` JSON Schema, both sourced from
 * the resolved Type Record. Skips records whose type doesn't resolve
 * (type/unknown already reports that) and skips Type Records themselves —
 * those validate against the compiled meta-schema (type/meta-schema), never
 * against `org/type/type.md` content (ADR-0002).
 */
export declare const typeFieldsValidate: RepoRule;
//# sourceMappingURL=typeFieldsValidate.d.ts.map