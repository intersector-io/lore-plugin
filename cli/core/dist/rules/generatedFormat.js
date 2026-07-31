import { ACTOR_PATTERN } from '../actor.js';
import { isIsoDatetime, readField } from './fieldHelpers.js';
/**
 * Top-level `generated` (OKF 0.2 trust family, replacing v0.1's `timestamp`):
 * when present it must be `{ by, at }` — `by` an actor in the convention
 * `actor.ts` owns (`human:<id>`, `process:<id>`, `<producer>/<version>`),
 * `at` an ISO-8601 datetime recording the last meaningful content change.
 * Optional field — absence is not an error.
 *
 * The legacy `timestamp` key is rejected permanently: lore cut over to
 * OKF 0.2 with no fallback reader, so a stored `timestamp` is a fact nothing
 * consumes. The refusal lives here rather than in `derived-field-stored`
 * because `timestamp` isn't derivable — it is this field under its old name,
 * and the rule that owns the field words the redirect.
 */
export const generatedFormat = {
    name: 'record/generated-format',
    check(ctx) {
        const root = ctx.frontmatter.value;
        const diagnostics = [];
        if (readField(root, ['timestamp']) !== undefined) {
            diagnostics.push({
                rule: 'record/generated-format',
                severity: 'error',
                file: ctx.file,
                pointer: '/timestamp',
                message: '`timestamp` was renamed by OKF 0.2 — record the last meaningful change as `generated: { by, at }` instead.',
            });
        }
        const generated = readField(root, ['generated']);
        const by = readField(root, ['generated', 'by']);
        const at = readField(root, ['generated', 'at']);
        if (generated !== undefined &&
            generated !== null &&
            !(typeof by === 'string' && ACTOR_PATTERN.test(by) && isIsoDatetime(at))) {
            diagnostics.push({
                rule: 'record/generated-format',
                severity: 'error',
                file: ctx.file,
                pointer: '/generated',
                message: '`generated` must be `{ by: <actor>, at: <ISO-8601 datetime> }` (OKF 0.2): `by` is `human:<id>`, `process:<id>`, or `<producer>/<version>`; `at` a valid date or datetime.',
            });
        }
        return diagnostics;
    },
};
//# sourceMappingURL=generatedFormat.js.map