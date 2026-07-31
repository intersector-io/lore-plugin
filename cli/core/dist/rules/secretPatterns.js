/**
 * Pattern helpers for the secret/PII lint family (docs/issues/0005; code
 * shapes hardened in docs/issues/0060). Kept deliberately conservative —
 * unambiguous, high-signal shapes only (PRD.md §13.9: false positives at a
 * hard gate erode trust). No entropy-only guessing; the assignment check
 * requires an explicit `key = value` shape plus a value that looks like key
 * material (multi-class entropy, or long single-class hex/base64 — the shape
 * real code credentials take), not just "looks random."
 *
 * `findSecrets` is the record-lint hard gate (all write paths) AND the
 * harvester's pre-LLM input gate over source code. `findPii` (email) is the
 * input gate ONLY: record frontmatter carries owner emails as identity by
 * design (CONTEXT.md "Identity Map"), so email can never be a record-lint
 * error — it screens what fixture/seed-adjacent source content may reach an
 * LLM prompt or a draft body.
 */
const PRIVATE_KEY = /-----BEGIN\s+((?:RSA|EC|OPENSSH|DSA|ENCRYPTED)\s+)?PRIVATE KEY-----[\s\S]+?-----END\s+((?:RSA|EC|OPENSSH|DSA|ENCRYPTED)\s+)?PRIVATE KEY-----/g;
const AWS_ACCESS_KEY = /\bAKIA[0-9A-Z]{16}\b/g;
const GITHUB_TOKEN = /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/g;
const SLACK_TOKEN = /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g;
const JWT = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const CONNECTION_STRING = /\b[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s:@/]+:[^\s@/]+@[^\s/]+/g;
const STRIPE_LIVE_KEY = /\bsk_live_[A-Za-z0-9]{16,}\b/g;
const GOOGLE_API_KEY = /\bAIza[0-9A-Za-z_-]{30,}\b/g;
/**
 * `key = value` where the key is a credential keyword as a complete
 * `_`/`-`-delimited segment chain — `client_secret`, `SECRET_KEY`,
 * `AWS_SECRET_ACCESS_KEY`, `apiKey` all match; `tokenizer` never does (the
 * keyword must end at the key's end or a separator, enforced by the `[:=]`
 * that immediately follows the segment chain). The pre-0060 pattern required
 * the keyword to start at a word boundary and touch the `[:=]`, which missed
 * every compound key real code uses.
 */
const ASSIGNMENT = /\b((?:[A-Za-z0-9]+[_-])*(?:password|passwd|secret|token|(?:api|access|auth|secret)[_-]?key)(?:[_-][A-Za-z0-9]+)*)\s*[:=]\s*['"]?([^\s'"]{16,})['"]?/gi;
/** Obvious placeholders an assignment-style match must not be flagged for. */
const PLACEHOLDER_PATTERNS = [
    /^<.*>$/,
    /^\$\{.*\}$/,
    /\.\.\./,
    /xxx/i,
    /example/i,
    /changeme/i,
    /placeholder/i,
    /your[-_]?(api)?[-_]?key/i,
    /redacted/i,
];
/**
 * One masking policy for every secret message (docs/issues/0087): a diagnostic
 * never reproduces a full matched credential — it echoes a short prefix so the
 * submitter can tell which value tripped the gate (with the line number) and
 * elides the rest. `secret/private-key` carries no value at all and
 * `secret/connection-string` redacts structurally; every other match masks here.
 * The `length - 1` cap keeps the prefix strictly shorter than the value even for
 * a future pattern that matches something short.
 */
function mask(value) {
    return `${value.slice(0, Math.min(8, value.length - 1))}...`;
}
/**
 * The `secret/token` family: vendor credential shapes that differ only by
 * pattern and label. Table-driven so the masking policy above is structural —
 * a new shape can't reintroduce a message that echoes the raw match, which is
 * exactly how the AWS/GitHub/Slack messages drifted (docs/issues/0087).
 */
const TOKEN_SHAPES = [
    { pattern: AWS_ACCESS_KEY, label: 'AWS-style access key id' },
    { pattern: GITHUB_TOKEN, label: 'GitHub-style token' },
    { pattern: SLACK_TOKEN, label: 'Slack-style token' },
    { pattern: JWT, label: 'JWT-shaped value' },
    { pattern: STRIPE_LIVE_KEY, label: 'Stripe-style live secret key' },
    { pattern: GOOGLE_API_KEY, label: 'Google-style API key' },
];
function lineOf(text, index) {
    let line = 1;
    for (let i = 0; i < index; i += 1) {
        if (text.charCodeAt(i) === 10)
            line += 1;
    }
    return line;
}
function looksLikePlaceholder(value) {
    return PLACEHOLDER_PATTERNS.some((p) => p.test(value));
}
/**
 * Multi-class "looks random" heuristic used only for the explicit
 * `key = value` assignment shape (never as a standalone entropy guess): the
 * value must mix at least 3 of {lowercase, uppercase, digit, symbol} classes.
 */
function hasMixedCharacterClasses(value) {
    let classes = 0;
    if (/[a-z]/.test(value))
        classes += 1;
    if (/[A-Z]/.test(value))
        classes += 1;
    if (/[0-9]/.test(value))
        classes += 1;
    if (/[^a-zA-Z0-9]/.test(value))
        classes += 1;
    return classes >= 3;
}
/**
 * Long single-class key material (docs/issues/0060): a 32-char hex API key
 * is only {lowercase, digit} and sailed through the 3-class check. Hex needs
 * 24+ chars; base64-ish needs 32+ plus at least one letter AND digit, so a
 * long hyphenated slug or prose word never qualifies.
 */
function looksLikeKeyMaterial(value) {
    if (hasMixedCharacterClasses(value))
        return true;
    if (/^[0-9a-f]{24,}$/i.test(value) && /\d/.test(value))
        return true;
    return /^[A-Za-z0-9+/=]{32,}$/.test(value) && /\d/.test(value) && /[A-Za-z]/.test(value);
}
/** Scan raw file content for every conservative secret shape. */
export function findSecrets(raw) {
    const matches = [];
    for (const match of raw.matchAll(PRIVATE_KEY)) {
        matches.push({
            rule: 'secret/private-key',
            line: lineOf(raw, match.index ?? 0),
            message: 'Private key block (PEM) found in record content.',
        });
    }
    for (const { pattern, label } of TOKEN_SHAPES) {
        for (const match of raw.matchAll(pattern)) {
            matches.push({
                rule: 'secret/token',
                line: lineOf(raw, match.index ?? 0),
                message: `${label} found: "${mask(match[0])}".`,
            });
        }
    }
    for (const match of raw.matchAll(CONNECTION_STRING)) {
        matches.push({
            rule: 'secret/connection-string',
            line: lineOf(raw, match.index ?? 0),
            message: `Connection string with embedded credentials found: "${redactConnectionString(match[0])}".`,
        });
    }
    for (const match of raw.matchAll(ASSIGNMENT)) {
        const key = match[1];
        const value = match[2];
        if (looksLikePlaceholder(value))
            continue;
        if (!looksLikeKeyMaterial(value))
            continue;
        matches.push({
            rule: 'secret/assignment',
            line: lineOf(raw, match.index ?? 0),
            message: `High-entropy value assigned to \`${key}\` — looks like a credential, not a placeholder.`,
        });
    }
    return matches;
}
function redactConnectionString(value) {
    return value.replace(/:\/\/([^:@/]+):([^@/]+)@/, '://$1:***@');
}
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
/**
 * PII shapes for the harvester's pre-LLM input gate (docs/issues/0060) —
 * deliberately NOT part of `findSecrets`/the record lint: owner emails in
 * record frontmatter are identity by design (CONTEXT.md "Identity Map"), so
 * an email hard gate on records would refuse the entire catalog. This
 * screens source-code content (fixtures, seeds, config) before it reaches an
 * LLM prompt.
 */
export function findPii(raw) {
    const matches = [];
    for (const match of raw.matchAll(EMAIL)) {
        matches.push({
            rule: 'pii/email',
            line: lineOf(raw, match.index ?? 0),
            message: `Email address found: "${match[0]}".`,
        });
    }
    return matches;
}
//# sourceMappingURL=secretPatterns.js.map