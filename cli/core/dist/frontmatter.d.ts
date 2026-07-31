export interface FrontmatterParseResult {
    /** Parsed frontmatter value, or undefined if the block is missing/unparseable. */
    value: unknown;
    /** Set when the file has no `---`-delimited frontmatter block at all. */
    missing: boolean;
    /** Set when a frontmatter block exists but is not valid YAML. */
    error?: Error;
}
/**
 * Extract and parse the YAML frontmatter block from a record's raw content.
 * Does not validate the parsed shape — that's the rules' job.
 */
export declare function parseFrontmatter(raw: string): FrontmatterParseResult;
/**
 * Split raw record text into its frontmatter YAML text and body, without
 * parsing the YAML. Used by scaffolding (src/scaffold.ts), which needs to
 * regenerate the frontmatter object while leaving the body untouched.
 * Returns undefined when there is no `---`-delimited frontmatter block.
 *
 * `frontmatterStart` is the offset of `frontmatterText` within `raw`, so a
 * caller editing the block in place can splice it back exactly where it came
 * from (`flipStatusToSuperseded`) instead of re-finding it by substring
 * search. The match already knows the offset; handing it back means no caller
 * has to re-derive it — or silently rely on the block being anchored at byte 0.
 */
export declare function splitFrontmatter(raw: string): {
    frontmatterText: string;
    frontmatterStart: number;
    body: string;
} | undefined;
/**
 * The inverse of `splitFrontmatter`: join a serialized frontmatter block and a
 * body into record text. The single place record text is *created* — used by
 * `scaffoldRecord` (`lore new`) and by `propose_record`'s candidate assembly,
 * which previously each hardcoded ``` `---\n${fm}\n---\n${body}` ``` (docs/issues/0045).
 *
 * The bytes this generates — the two `---` delimiters, and the newlines inside
 * the frontmatter block — adopt the convention of the *body it is handed*. A
 * YAML serializer always emits LF, while the body arrives from a file on disk,
 * so on a CRLF working tree (git's `core.autocrlf` default on Windows) the old
 * hardcoded join produced a record that was LF above the `---` and CRLF below
 * it.
 *
 * A body with no line endings to copy (single-line, or empty) composes as LF.
 */
export declare function composeRecord(frontmatterText: string, body: string): string;
//# sourceMappingURL=frontmatter.d.ts.map