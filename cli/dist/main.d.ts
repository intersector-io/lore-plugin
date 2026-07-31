export interface CliIo {
    cwd: string;
    stdout: (chunk: string) => void;
    stderr: (chunk: string) => void;
}
/**
 * Programmatic CLI entry point. The `lore` binary (src/cli.ts) is a thin
 * wrapper over this function — everything a test needs to assert (exit
 * code, stdout/stderr) is reachable here without spawning a process.
 */
export declare function main(argv: string[], io: CliIo): Promise<number>;
//# sourceMappingURL=main.d.ts.map