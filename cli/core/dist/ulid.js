import { randomBytes } from 'node:crypto';
// Crockford base32 alphabet (excludes I, L, O, U) — the ULID spec's encoding.
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LEN = 32;
const TIME_LEN = 10; // 48-bit timestamp -> 10 base32 chars
const RANDOM_LEN = 16; // 80-bit randomness -> 16 base32 chars
const RANDOM_BYTE_LEN = 10; // 80 bits
let lastTimeMs = -1;
let lastRandomBytes = null;
/**
 * Generate a fresh ULID (CONTEXT.md "Record ID"; PRD.md §11.2).
 *
 * Server/tooling-assigned only — commands never accept a caller-supplied id
 * (docs/issues/0007). Monotonic within this process: two ULIDs generated in
 * the same millisecond preserve generation order by incrementing the random
 * component, per the ULID spec's monotonic factory pattern, rather than
 * relying on two random draws happening to sort correctly.
 */
export function generateUlid(now = () => new Date()) {
    const timeMs = now().getTime();
    let randomComponent;
    if (lastRandomBytes && timeMs <= lastTimeMs) {
        randomComponent = incrementRandom(lastRandomBytes);
    }
    else {
        randomComponent = new Uint8Array(randomBytes(RANDOM_BYTE_LEN));
    }
    const effectiveTimeMs = Math.max(timeMs, lastTimeMs);
    lastTimeMs = effectiveTimeMs;
    lastRandomBytes = randomComponent;
    return encodeTime(effectiveTimeMs) + encodeRandom(randomComponent);
}
function encodeTime(timeMs) {
    let value = timeMs;
    let str = '';
    for (let i = 0; i < TIME_LEN; i += 1) {
        const mod = value % ENCODING_LEN;
        str = ENCODING[mod] + str;
        value = (value - mod) / ENCODING_LEN;
    }
    return str;
}
function encodeRandom(bytes) {
    let bits = 0n;
    for (const b of bytes)
        bits = (bits << 8n) | BigInt(b);
    let str = '';
    for (let i = 0; i < RANDOM_LEN; i += 1) {
        const shift = BigInt((RANDOM_LEN - 1 - i) * 5);
        const idx = Number((bits >> shift) & 0x1fn);
        str += ENCODING[idx];
    }
    return str;
}
/** Increments an 80-bit big-endian byte string by 1, carrying across bytes. */
function incrementRandom(bytes) {
    const next = new Uint8Array(bytes);
    for (let i = next.length - 1; i >= 0; i -= 1) {
        if (next[i] < 0xff) {
            next[i] += 1;
            return next;
        }
        next[i] = 0;
    }
    // 80-bit overflow is astronomically unlikely; fall back to fresh randomness.
    return new Uint8Array(randomBytes(RANDOM_BYTE_LEN));
}
//# sourceMappingURL=ulid.js.map