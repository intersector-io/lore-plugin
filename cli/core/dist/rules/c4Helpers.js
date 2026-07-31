/**
 * C4 type family (ADR-0012): the element types and the per-type `x-type`
 * reference fields whose targets the `c4/reference` rule resolves. Kept here so
 * the rule and any future C4 tooling share one definition of the family.
 */
export const C4_ELEMENT_TYPES = [
    'c4-person',
    'c4-external-system',
    'c4-system',
    'c4-container',
    'c4-component',
];
export const C4_RELATIONSHIP_TYPE = 'c4-relationship';
/** Per-type `x-type` reference fields. Containment is single-valued and level-typed. */
export const C4_REFERENCES = {
    'c4-container': [{ field: 'system', requiredType: 'c4-system' }],
    'c4-component': [{ field: 'container', requiredType: 'c4-container' }],
    'c4-relationship': [{ field: 'source' }, { field: 'target' }],
};
export function isC4ElementType(type) {
    return typeof type === 'string' && C4_ELEMENT_TYPES.includes(type);
}
//# sourceMappingURL=c4Helpers.js.map