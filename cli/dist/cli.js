#!/usr/bin/env node
import { main } from './main.js';
const exitCode = await main(process.argv.slice(2), {
    cwd: process.cwd(),
    stdout: (chunk) => process.stdout.write(chunk),
    stderr: (chunk) => process.stderr.write(chunk),
});
process.exitCode = exitCode;
//# sourceMappingURL=cli.js.map