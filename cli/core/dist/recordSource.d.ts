/**
 * Where `validateCandidate`/`validateFiles` read the record tree from
 * (docs/issues/0113). Every rule (ADR-0002) still lives in `@lore/core`, and
 * so does this interface — but *reading* it is a host concern: the plain
 * filesystem for the CLI and every existing caller, or a specific git ref for
 * a host that must answer the same regardless of what happens to be checked
 * out on disk (`apps/indexer`'s `gitRefRecordSource`, used by the API's
 * `validate_record`). `@lore/core` never learns about git; it only defines the
 * seam and the filesystem implementation every caller already had.
 */
export interface RecordSource {
    /** Record-relative paths (forward-slash) this source currently has. */
    listFiles(): Promise<string[]>;
    /**
     * `file`'s content, or `undefined` when this source has no such file.
     * `file` may be any repo-relative path, not just a record — `.lore/*`
     * config files are read through the same seam.
     */
    readFile(file: string): Promise<string | undefined>;
}
/** The default `RecordSource`: reads straight off disk under `rootDir`, exactly what every path did before this abstraction existed. */
export declare function filesystemRecordSource(rootDir: string): RecordSource;
//# sourceMappingURL=recordSource.d.ts.map