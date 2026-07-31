import type { Rule } from './types.js';
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
export declare const generatedFormat: Rule;
//# sourceMappingURL=generatedFormat.d.ts.map