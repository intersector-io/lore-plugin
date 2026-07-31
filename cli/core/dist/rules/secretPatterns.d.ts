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
export interface SecretMatch {
    /** Rule id to attribute the finding to (`secret/private-key`, `secret/token`, ...). */
    rule: string;
    /** 1-based line number the match starts on, for a readable message. */
    line: number;
    message: string;
}
/** Scan raw file content for every conservative secret shape. */
export declare function findSecrets(raw: string): SecretMatch[];
/**
 * PII shapes for the harvester's pre-LLM input gate (docs/issues/0060) —
 * deliberately NOT part of `findSecrets`/the record lint: owner emails in
 * record frontmatter are identity by design (CONTEXT.md "Identity Map"), so
 * an email hard gate on records would refuse the entire catalog. This
 * screens source-code content (fixtures, seeds, config) before it reaches an
 * LLM prompt.
 */
export declare function findPii(raw: string): SecretMatch[];
//# sourceMappingURL=secretPatterns.d.ts.map