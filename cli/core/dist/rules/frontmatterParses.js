/**
 * Frontmatter must be present and parse as YAML. This is the load-bearing
 * rule every other rule depends on: if it fails, later rules simply have
 * nothing to check (see validate.ts, which skips them in that case).
 */
export const frontmatterParses = {
    name: 'frontmatter-parses',
    check(ctx) {
        if (ctx.frontmatter.missing) {
            return [
                {
                    rule: 'frontmatter-parses',
                    severity: 'error',
                    file: ctx.file,
                    pointer: '',
                    message: 'No YAML frontmatter block found (expected a leading `---` delimited block).',
                },
            ];
        }
        if (ctx.frontmatter.error) {
            return [
                {
                    rule: 'frontmatter-parses',
                    severity: 'error',
                    file: ctx.file,
                    pointer: '',
                    message: `Frontmatter is not valid YAML: ${ctx.frontmatter.error.message}`,
                },
            ];
        }
        return [];
    },
};
//# sourceMappingURL=frontmatterParses.js.map