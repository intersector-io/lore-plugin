/**
 * Wire DTOs shared by API responses and the portal SPA (2026-07-17 pure-
 * derivations-and-wire-dtos spec §B). These are the portable, JSON-serialized
 * shapes that `apps/indexer`/`apps/api` produce and `apps/portal` consumes over
 * HTTP — declared once so the two sides can't silently drift (the bug this
 * file replaces: `apps/portal/src/api.ts` had hand-copied a `SearchResultRow`
 * missing the `path` field the server actually sends).
 *
 * TYPE-ONLY: zero imports, zero runtime code. The portal build depends on this
 * staying dependency-free — never import anything into this file.
 */
export type C4Level = 'context' | 'container' | 'component';
/** One diagram element. `parent` is the containment parent (container → system, component → container). */
export interface C4Node {
    ulid: string;
    type: string;
    title: string;
    technology?: string;
    parent?: string;
}
export interface C4Edge {
    source: string;
    target: string;
    description: string;
    technology?: string;
}
export interface C4Boundary {
    ulid: string;
    title: string;
}
export interface C4View {
    level: C4Level;
    roots: string[];
    nodes: C4Node[];
    edges: C4Edge[];
    boundaries: C4Boundary[];
}
export type ChangeEventKind = 'promoted' | 'revised' | 'superseded' | 'retired' | 'deleted';
/** One canonical-ref change, derived by the indexer from git history. Wire form — `occurredAt` is an ISO string. */
export interface ChangeEventWire {
    eventId: string;
    ulid: string;
    kind: ChangeEventKind;
    recordType: string;
    scope: string;
    title: string;
    path: string;
    commitSha: string;
    /** Parsed from the merge commit when present; null on squash/rebase hosts. */
    prNumber: number | null;
    occurredAt: string;
    /**
     * Read-time decoration, not part of the commit snapshot: does a record with
     * this ULID still exist on the canonical ref? False once a deletion lands —
     * surfaces render such events without record links (docs/issues/0076).
     * Existence, not visibility: a record moved into a scope the caller cannot
     * see still reads true (its link may 404 for that caller — the pre-existing
     * cross-scope-move behavior, unchanged). A deletion later reverted flips
     * back to true, so restored history re-links.
     */
    onCanon: boolean;
}
export interface SearchMatch {
    headingPath: string;
    snippet: string;
}
export interface SearchResultRow {
    ulid: string;
    ref: string;
    /** `true` iff this row is a `draft/**` row shown because no canonical row of the same id matched. */
    isDraft: boolean;
    type: string;
    status: string;
    scope: string;
    title: string;
    description: string;
    tags: unknown[];
    path: string;
    /** Fused RRF score — comparable only within one search call. */
    score: number;
    match: SearchMatch;
}
export interface SearchResponse {
    results: SearchResultRow[];
    nextCursor: string | null;
}
export interface PortalTreeRecord {
    ulid: string;
    title: string;
    status: string;
}
export interface PortalTreeType {
    type: string;
    records: PortalTreeRecord[];
}
export interface PortalTreeScope {
    scope: string;
    types: PortalTreeType[];
}
export interface PortalTree {
    scopes: PortalTreeScope[];
}
/** What the server says this principal may do — the SPA renders these, it does not derive them. */
export interface PortalSession {
    /** Display identity (CONTEXT.md "Identity Map"). */
    id: string;
    /** Admin role claim (`identity.adminRole`, ADR-0006) — gates the govern/install surfaces, including the authorization editor (ADR-0010). */
    isAdmin: boolean;
    /**
     * The resolved approve set (ADR-0010) — the scopes whose proposals this
     * principal may decide. The set, not a boolean: a two-team lead who approves
     * `team:a` must not be offered live decision controls on a `team:b` proposal
     * (docs/issues/0089). Non-empty ≡ the old `canReview`; per-scope coverage is
     * still server-enforced.
     */
    approve: string[];
    /** The resolved contribute set is non-empty (ADR-0010) — with `authoringEnabled`, shows the Contribute surfaces (ADR-0009). */
    canPropose: boolean;
    /** Portal authoring opt-in (ADR-0009): the `portalAuthoring` runtime-config flag. The server enforces it on `/portal/authoring/*`; the SPA mirror just hides the surfaces. */
    authoringEnabled: boolean;
    /** This instance can mint long-lived MCP tokens (docs/issues/0123) — true iff local auth mode, where `POST /api/auth/token` exists at all. The SPA offers the surface off this rather than sniffing the auth mode for itself. */
    mcpTokensEnabled: boolean;
    /**
     * How many proposals one bulk rejection may carry (docs/issues/0104). Served
     * rather than mirrored as a client constant: the SPA chunks a larger pile to
     * this size, and two copies of the limit drift the moment the server's moves
     * — which shows up as an entire pile 400ing on a cached SPA. Same reasoning
     * that retired the client-side admin-role mirror.
     */
    maxBulkReject: number;
    /** False on a fresh install (setup mode): an admin completes the wizard before anything else works. */
    configured: boolean;
}
export interface PortalStatus {
    lastIndexedCommit: {
        sha: string;
        indexedAt: string;
    } | null;
    remoteHead: string | null;
    fresh: boolean;
}
export type HealthCount = {
    /** The grouped value — a type, scope, or status. */
    key: string;
    count: number;
};
export type HealthRecord = {
    ulid: string;
    title: string;
    scope: string;
    type: string;
    status: string;
};
export type HealthReferencedRecord = HealthRecord & {
    /** Incoming typed-link edges pointing at this record. */
    referenceCount: number;
};
export interface HealthMetrics {
    totals: {
        /** Canonical records (`ref = 'main'`). */
        canon: number;
        /** Distinct records that exist only on a draft branch — proposed, not yet promoted. */
        draft: number;
    };
    byType: HealthCount[];
    byScope: HealthCount[];
    byStatus: HealthCount[];
    orphanCount: number;
    recentlyPromoted: HealthRecord[];
    superseded: HealthRecord[];
    orphans: HealthRecord[];
    mostReferenced: HealthReferencedRecord[];
}
export interface UsageSeriesPoint {
    /** UTC day, `YYYY-MM-DD`. */
    date: string;
    searches: number;
    reads: number;
}
export type TopRecord = {
    ulid: string;
    title: string;
    count: number;
};
export interface TopScope {
    scope: string;
    count: number;
}
/** One UTC day's count of zero-result searches. A dedicated point (not `UsageSeriesPoint`) — there is one leg to count, not two, and folding it into a fake `searches`/`reads` leg would be dishonest. */
export interface SearchGapDay {
    /** UTC day, `YYYY-MM-DD`. */
    date: string;
    count: number;
}
/**
 * Zero-result searches (`result_count = 0`) over the window — real agent demand
 * for knowledge that isn't there yet, "candidate records to author". Query text
 * is never stored (frozen invariant), so this aggregates the structural filters
 * a search carried: which scopes it looked in, which types it wanted.
 */
export interface SearchGaps {
    /** Zero-result searches in the window (deployment-wide, like the usage series). */
    total: number;
    /** 30-day zero-filled daily counts. */
    series: SearchGapDay[];
    /** Where empty searches looked, scoped to the caller — plus an `(all scopes)` bucket for searches that carried no scope filter. */
    byScope: {
        scope: string;
        count: number;
    }[];
    /** What types empty searches wanted (deployment-wide, like the health `byType` count — a type is not a scope secret). */
    byType: {
        type: string;
        count: number;
    }[];
}
export interface UsageMetrics {
    series: UsageSeriesPoint[];
    topRecords: TopRecord[];
    topScopes: TopScope[];
    /** Reads that reached a scope only via a grant (non-empty `grantedNamespaces`) — the sharing-value signal. */
    grantValue: number;
    /** Zero-result searches — the knowledge-gap signal (HoP roadmap A2). */
    searchGaps: SearchGaps;
}
/**
 * A canonical record on the review queue (HoP roadmap A3), ordered by its last
 * substantive change. `lastChangedAt` is derived from git history
 * (`MAX(change_events.occurred_at)`, which survives rebuilds) — `null` means no
 * recorded change event yet (sorted first, never a fabricated date). The queue
 * itself still renders no "stale" verdict of its own: `staleAfter` is the
 * *author's* declared expiry (OKF 0.2 `stale_after`, issue 0101) read straight
 * off frontmatter, and records past it sort ahead of the merely-old.
 */
export interface ReviewQueueItem {
    ulid: string;
    path: string;
    title: string;
    type: string;
    scope: string;
    /** ISO timestamp of the last recorded change, or `null` when none is on record. */
    lastChangedAt: string | null;
    /** The record's declared `stale_after` expiry (`YYYY-MM-DD`), or `null` when it declares none. */
    staleAfter: string | null;
    /** True once today has reached `staleAfter` — computed by the same query (and clock) that orders the queue, so sort and label can never disagree. */
    expired: boolean;
}
/** One record inside a duplicate-title group. */
export interface HygieneRecordRef {
    ulid: string;
    path: string;
    title: string;
    type: string;
    scope: string;
}
/**
 * Active canonical records whose titles collide after normalization
 * (lowercase, punctuation folded to spaces). Groups span scopes — a
 * duplicate across two teams is still a duplicate.
 */
export interface DuplicateTitleGroup {
    normalizedTitle: string;
    records: HygieneRecordRef[];
}
/**
 * A body-link `references` edge on canon whose target is gone. The two
 * shapes are INDEX-STALENESS states of that one defect, not two causes:
 * `targetUlid` set means the edge resolved when its source was last ingested
 * and the target has since left canon (docs/issues/0076); `targetPath` set
 * means it did not resolve at ingest time — because the target never
 * existed, or because the source was re-ingested/rebuilt after the target's
 * deletion, which re-harvests the edge as unresolved. A full rebuild
 * therefore renders every finding in the path shape; the defect itself is
 * unchanged either way. Exactly one of the two fields is non-null
 * (`target_key` is generated NOT NULL from their coalesce).
 */
export interface DanglingReference {
    sourceUlid: string;
    sourcePath: string;
    sourceTitle: string;
    sourceScope: string;
    targetPath: string | null;
    targetUlid: string | null;
}
/**
 * The canon hygiene report (docs/issues/0058): rule-based, report-only
 * gardening findings. No LLM, no stored state, no auto-fix — every finding
 * points a human at propose_revision or supersession. Cold canon is
 * deliberately NOT here: the review queue is already that surface.
 */
export interface CanonHygiene {
    duplicateTitles: DuplicateTitleGroup[];
    danglingReferences: DanglingReference[];
}
export interface HarvestRunCounts {
    proposed: number;
    refused: number;
    wouldPropose: number;
    skipped: number;
    droppedDuplicate: number;
}
export interface HarvestRunBatch {
    scope: string;
    branch: string;
    prUrl: string;
    candidateCount: number;
}
/** A stored harvest run as returned by `GET /api/portal/harvest-runs`. */
export interface HarvestRunRow {
    runId: string;
    startedAt: string;
    finishedAt: string;
    sourceRepo: string;
    targetScope: string;
    dryRun: boolean;
    status: 'completed' | 'failed';
    error: string | null;
    counts: HarvestRunCounts;
    batches: HarvestRunBatch[];
}
export interface FactoryResetSummary {
    /** Absolute paths of the runtime state files that existed and were deleted (empty on a second, idempotent call). */
    clearedFiles: string[];
    /** Whether the index tables were truncated (always true once `clearIndex` succeeds). */
    indexCleared: boolean;
    /** Whether the checkout existed and was removed (false when there was nothing to remove). */
    checkoutRemoved: boolean;
}
//# sourceMappingURL=wire.d.ts.map