import posixPath from 'node:path/posix';
// Fenced code blocks (```...``` or ~~~...~~~) are stripped before scanning —
// templates in Type Records embed literal markdown/frontmatter samples that
// are not real body links.
const FENCE = /^(```|~~~).*$[\s\S]*?^\1\s*$/gm;
const MD_LINK = /\[[^\]]*\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;
const EXTERNAL_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
/**
 * Extracts every internal body markdown link from `raw` (a record's full
 * file content, frontmatter included — fenced code blocks are stripped
 * first). Shared by the `links/reference` CI rule (warns on unresolved
 * targets) and the indexer's `references` edge harvesting (docs/issues/0009)
 * — one extraction pass so the two can never disagree on what counts as a
 * body link.
 */
export function extractBodyLinks(file, raw) {
    const body = raw.replace(FENCE, '');
    const links = [];
    for (const match of body.matchAll(MD_LINK)) {
        const rawTarget = match[1];
        const resolvedPath = resolveInternalTarget(file, rawTarget);
        if (resolvedPath === undefined)
            continue; // external URL or pure anchor
        links.push({ rawTarget, resolvedPath });
    }
    return links;
}
/**
 * Reference (docs/issues/0004-link-rules.md, CONTEXT.md "Reference"): a body
 * markdown link whose target resolves to a path inside the repo (relative or
 * root-absolute, OKF-style with or without the `.md` suffix) but that file
 * doesn't exist — warning, never an error. External URLs and pure anchors
 * are ignored; the indexer harvests every such link as a `references` edge
 * regardless of whether it resolves.
 */
export const reference = {
    name: 'links/reference',
    check(ctx) {
        const knownFiles = new Set(ctx.allFiles);
        const diagnostics = [];
        for (const f of ctx.files) {
            for (const link of extractBodyLinks(f.file, f.raw)) {
                if (knownFiles.has(link.resolvedPath))
                    continue;
                diagnostics.push({
                    rule: 'links/reference',
                    severity: 'warning',
                    file: f.file,
                    pointer: '/body',
                    message: `Body link target "${link.rawTarget}" does not resolve to a file in this repo (resolved: "${link.resolvedPath}").`,
                });
            }
        }
        diagnostics.sort((a, b) => a.file.localeCompare(b.file) || a.message.localeCompare(b.message));
        return diagnostics;
    },
};
/** Resolves a markdown link target to a repo-relative `.md` path, or `undefined` if it's external/a pure anchor. */
function resolveInternalTarget(sourceFile, rawTarget) {
    const [withoutFragment] = rawTarget.split('#');
    if (!withoutFragment)
        return undefined; // pure anchor, e.g. "#section"
    if (EXTERNAL_SCHEME.test(withoutFragment))
        return undefined; // http(s)://, mailto:, etc.
    const rootRelative = withoutFragment.startsWith('/')
        ? withoutFragment.slice(1)
        : posixPath.join(posixPath.dirname(sourceFile), withoutFragment);
    const normalized = posixPath.normalize(rootRelative);
    return normalized.endsWith('.md') ? normalized : `${normalized}.md`;
}
//# sourceMappingURL=reference.js.map