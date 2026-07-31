import { findSecrets } from './secretPatterns.js';
/**
 * Secret lint (CONTEXT.md "Secret Lint", PRD.md §13.9): a hard gate in the
 * validation core across all write paths. Scans the raw file content — both
 * frontmatter and body — for unambiguous secret/credential shapes: private
 * key blocks, AWS/GitHub/Slack-style tokens, JWTs, connection strings with
 * embedded credentials, and explicit high-entropy `key = value` assignments.
 * Deliberately conservative: unmatched shapes (prose, plain assignments)
 * pass silently rather than risk a false-positive hard failure.
 */
export const secretLint = {
    name: 'secret-lint',
    check(ctx) {
        return findSecrets(ctx.raw).map((match) => ({
            rule: match.rule,
            severity: 'error',
            file: ctx.file,
            pointer: `/body#L${match.line}`,
            message: match.message,
        }));
    },
};
//# sourceMappingURL=secretLint.js.map