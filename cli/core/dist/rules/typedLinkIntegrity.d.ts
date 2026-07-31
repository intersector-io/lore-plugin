import type { RepoRule } from './types.js';
/**
 * Typed-link integrity (docs/issues/0004-link-rules.md, CONTEXT.md "Typed
 * Link"): every ULID referenced by `x-lore.links.{supersedes,implements,
 * constrains,relates}` must exist as another record's `x-lore.id` in this
 * repo — error otherwise. CI-enforced, unlike the lenient body-link
 * `references` edge (`links/reference`).
 */
export declare const typedLinkIntegrity: RepoRule;
//# sourceMappingURL=typedLinkIntegrity.d.ts.map