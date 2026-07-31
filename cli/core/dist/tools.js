/**
 * The knowledge tools' names, and what kind of consumption each represents.
 *
 * Lives in core because two packages need to agree on it and neither owns the
 * other: `@lore/api` names these tools when it registers them for MCP and emits
 * a usage event per call; `@lore/indexer` groups those events into the portal's
 * usage series. That agreement used to be a comment ("keep in sync if a
 * read/search tool is added") — so adding a fifth tool would silently have made
 * it count as neither a search nor a read.
 *
 * Only the four *knowledge* tools appear here. The authoring/governance tools
 * (`validate_record`, `create_record`, `propose_record`, `retract`,
 * `get_proposal`) emit usage events too, but they are writes and proposals, not
 * consumption of canon — the usage dashboard is deliberately about what the
 * knowledge base is *used for* (CONTEXT.md "Usage Metrics").
 */
/** Tools that read the index broadly — a "search" in the usage series. */
export const SEARCH_TOOLS = ['search_knowledge', 'list_records'];
/** Tools that fetch a specific record or its neighbourhood — a "read" in the usage series. */
export const READ_TOOLS = ['get_record', 'get_related'];
/**
 * The single tool whose usage event carries one record ULID in `filters` — and
 * therefore the only one the "top records" list can rank by.
 */
export const RECORD_FETCH_TOOL = 'get_record';
//# sourceMappingURL=tools.js.map