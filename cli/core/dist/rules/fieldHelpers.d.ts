/** Shared helpers for reading and validating frontmatter fields across rules. */
export declare function isNonEmptyString(value: unknown): value is string;
/** A plausible `YYYY-MM-DD` date — the ONE answer to "what is a date" for `stale_after` and x-type `format: date` alike. */
export declare function isIsoDate(value: unknown): value is string;
/** An ISO-8601 date or datetime, as `generated.at` requires. */
export declare function isIsoDatetime(value: unknown): value is string;
/** Reads a nested field from a parsed frontmatter value by key path. */
export declare function readField(frontmatter: unknown, path: string[]): unknown;
//# sourceMappingURL=fieldHelpers.d.ts.map