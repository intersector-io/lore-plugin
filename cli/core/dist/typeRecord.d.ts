import type { JsonSchemaLike } from './jsonSchema.js';
/**
 * The full authoring bundle for one type, sourced from its Type Record
 * (docs/issues/0016 `create_record`, CONTEXT.md "Type Record"): the fenced
 * authoring template, the `x-type` JSON Schema, the required body sections,
 * the reviewer checklist body, and the classification test. Every field is
 * read straight out of the same Type Record content `scaffoldRecord` and the
 * validation core (`type/fields`, `type/meta-schema`) already treat as
 * authoritative — no separate copy to drift.
 */
export interface TypeAuthoringBundle {
    type: string;
    /** Fenced ```markdown authoring template body (frontmatter + placeholder body). */
    template: string;
    /** `x-lore-type.schema`, if the Type Record declares one. */
    schema?: JsonSchemaLike;
    /** `x-lore-type.required-sections`. */
    requiredSections: string[];
    /** Raw markdown body of the "## Reviewer Checklist" section (empty string if absent). */
    checklist: string;
    /** `x-lore-type.classification-test`. */
    classificationTest: string;
}
/** One entry of the authorable type catalog: enough to *choose* a type, not to author one — `getTypeAuthoringBundle` supplies the rest. */
export interface TypeSummary {
    /** Slug to pass as `type` to create_record/validate_record/propose_record — the `org/type/<slug>.md` filename. */
    slug: string;
    title: string;
    description: string;
}
/**
 * The catalog of authorable types (docs/issues/0044): every Type Record under
 * `org/type/`, sorted by slug. Without this the catalog is undiscoverable —
 * a type with no records yet is invisible to `list_records`, so an agent can
 * only guess a slug and read the 404 from `create_record`.
 *
 * Files under `org/type/` that aren't Type Records (`type: type`) are skipped
 * rather than surfaced as broken types: `type/meta-schema` already blocks
 * those from ever reaching `main`, so this is defensive against a mid-review
 * working tree, not a second validation.
 *
 * A repo with no `org/type/` directory is an empty catalog, not an error —
 * `validate_record` reports the missing catalog through the rule pipeline,
 * and whoami must not fail just because the repo is a fresh checkout.
 */
export declare function listTypeRecords(repoRoot: string): Promise<TypeSummary[]>;
/**
 * Resolve a Type Record and extract its authoring bundle (docs/issues/0016).
 * Reuses `scaffoldRecord`'s own template extraction and refusal shape
 * (`ScaffoldError`, rule `scaffold/unknown-type` / `scaffold/missing-template`)
 * so an unknown type is refused identically whether the caller is
 * `create_record` or `lore new`.
 *
 * @throws {ScaffoldError} unknown type, or a Type Record missing its template.
 */
export declare function getTypeAuthoringBundle(repoRoot: string, type: string): Promise<TypeAuthoringBundle>;
//# sourceMappingURL=typeRecord.d.ts.map