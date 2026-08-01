import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { discoverRecords } from './discoverRecords.js';
/** The default `RecordSource`: reads straight off disk under `rootDir`, exactly what every path did before this abstraction existed. */
export function filesystemRecordSource(rootDir) {
    return {
        listFiles: () => discoverRecords(rootDir),
        readFile: async (file) => {
            try {
                return await readFile(path.join(rootDir, file), 'utf8');
            }
            catch (err) {
                if (err?.code === 'ENOENT')
                    return undefined;
                throw err;
            }
        },
    };
}
//# sourceMappingURL=recordSource.js.map