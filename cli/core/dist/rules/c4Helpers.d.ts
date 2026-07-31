/**
 * C4 type family (ADR-0012): the element types and the per-type `x-type`
 * reference fields whose targets the `c4/reference` rule resolves. Kept here so
 * the rule and any future C4 tooling share one definition of the family.
 */
export declare const C4_ELEMENT_TYPES: readonly ["c4-person", "c4-external-system", "c4-system", "c4-container", "c4-component"];
export type C4ElementType = (typeof C4_ELEMENT_TYPES)[number];
export declare const C4_RELATIONSHIP_TYPE = "c4-relationship";
/** A reference field under `x-type`; `requiredType` undefined means "any C4 element". */
export interface C4Ref {
    field: string;
    requiredType?: C4ElementType;
}
/** Per-type `x-type` reference fields. Containment is single-valued and level-typed. */
export declare const C4_REFERENCES: Record<string, C4Ref[]>;
export declare function isC4ElementType(type: unknown): type is C4ElementType;
//# sourceMappingURL=c4Helpers.d.ts.map