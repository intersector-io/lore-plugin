import type { Rule } from './types.js';
/**
 * Closed `x-lore` shape (docs/issues/0095): the `x-lore` block accepts only
 * its known members. Nothing else validates the block's key set, so an
 * unknown member (`depends_on`, `superseded_by`, …) sailed through and landed
 * permanently in canon — and `propose_revision` can never remove it (`links`
 * is the only member it may replace). Closing the shape here rejects the
 * unknown member at authoring time, before it becomes canon.
 */
export declare const xLoreShape: Rule;
//# sourceMappingURL=xLoreShape.d.ts.map