/** Shared helpers for reading and validating frontmatter fields across rules. */
export function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
/** A plausible `YYYY-MM-DD` date — the ONE answer to "what is a date" for `stale_after` and x-type `format: date` alike. */
export function isIsoDate(value) {
    return typeof value === 'string' && ISO_DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}
/** An ISO-8601 date or datetime, as `generated.at` requires. */
export function isIsoDatetime(value) {
    return typeof value === 'string' && ISO_DATETIME_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}
/** Reads a nested field from a parsed frontmatter value by key path. */
export function readField(frontmatter, path) {
    let current = frontmatter;
    for (const key of path) {
        if (typeof current !== 'object' || current === null || Array.isArray(current)) {
            return undefined;
        }
        current = current[key];
    }
    return current;
}
//# sourceMappingURL=fieldHelpers.js.map