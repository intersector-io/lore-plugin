// Crockford base32 alphabet (excludes I, L, O, U) — the ULID spec's encoding.
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
/**
 * Well-formed ULID: 26-character Crockford base32, first character in
 * `0`-`7` (keeps the embedded 48-bit timestamp within its valid range).
 */
export function isWellFormedUlid(value) {
    if (!ULID_PATTERN.test(value))
        return false;
    const first = value[0].toUpperCase();
    return first >= '0' && first <= '7';
}
//# sourceMappingURL=ulid.js.map