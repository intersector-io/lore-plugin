/**
 * Generate a fresh ULID (CONTEXT.md "Record ID"; PRD.md §11.2).
 *
 * Server/tooling-assigned only — commands never accept a caller-supplied id
 * (docs/issues/0007). Monotonic within this process: two ULIDs generated in
 * the same millisecond preserve generation order by incrementing the random
 * component, per the ULID spec's monotonic factory pattern, rather than
 * relying on two random draws happening to sort correctly.
 */
export declare function generateUlid(now?: () => Date): string;
//# sourceMappingURL=ulid.d.ts.map