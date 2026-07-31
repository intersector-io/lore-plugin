import { discoverRecords } from './discoverRecords.js';
import { parseFrontmatter } from './frontmatter.js';
import { readLoreConfigFiles } from './loreConfigFiles.js';
import { loadRepoContexts, runConfigRules, runRecordRules, runRepoRules } from './pipeline.js';
import { isNonEmptyString, readField } from './rules/fieldHelpers.js';
import { pathUnique } from './rules/pathUnique.js';
import { placement } from './rules/placement.js';
import { ulidUnique } from './rules/ulidUnique.js';
import { resolveScope, slugify } from './scaffold.js';
import { summarize } from './validate.js';
/** Placeholder file id used when a candidate's would-be repo path can't be derived (no scope, or no title to slugify). Never collides with a real discovered path — those all live under org/, products/, teams/. */
function placeholderFile(type) {
    return `<candidate>/${type}.md`;
}
/**
 * Rules that need a real repo path to mean anything (placement checks the
 * path's type directory; ULID uniqueness only matters once a candidate has a
 * concrete slot to occupy — docs/issues/0016; path uniqueness has no path to
 * collide on until one is derived).
 *
 * Taken from the rules themselves rather than retyped as string literals: a
 * rule rename would otherwise desync this set silently, with no compile error.
 */
const PATH_DEPENDENT_RULE_NAMES = new Set([placement.name, ulidUnique.name, pathUnique.name]);
/**
 * Syntactically valid but *unmintable* — a real ULID's timestamp prefix is
 * never all zeros — so it can never collide in `ulid-unique` and can never be
 * mistaken for a real id if it surfaces.
 */
const UNASSIGNED_ULID = '00000000000000000000000000';
function isPlainObject(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}
/**
 * A candidate legitimately arrives with no `x-lore.id`: `propose_record`
 * assigns it (along with the path and the `generated` stamp) and overwrites anything
 * submitted, which is why `create_record`'s template ships the slot blank.
 * Validate such a candidate under the id it is about to be given, or the
 * documented loop — create_record → fill → validate until clean →
 * propose_record — can never reach "clean". An id the caller DID supply is
 * left alone, so `ulid-format`/`ulid-unique`/`lore-required-fields` stay live
 * for it.
 *
 * Only the parsed frontmatter is overlaid, never `raw`: byte-offset
 * diagnostics (secret lint's `/body#Ln`) must keep pointing at the content the
 * caller actually sent.
 */
function withAssignedId(value) {
    if (!isPlainObject(value))
        return value;
    const lore = value['x-lore'];
    if (lore !== undefined && !isPlainObject(lore))
        return value;
    if (isNonEmptyString(lore?.id))
        return value;
    return { ...value, 'x-lore': { ...lore, id: UNASSIGNED_ULID } };
}
/**
 * The `type` argument is authoritative, exactly as it is on the propose path
 * (docs/issues/0083). `propose_record` writes `frontmatter.type = <argument>`
 * before it validates anything, so a candidate whose frontmatter says
 * something else is judged — there and here — under the argument. Judging it
 * under the frontmatter instead made `validate_record` and `propose_record`
 * answer differently for byte-identical input: an unknown argument slug used
 * to surface as `record/placement` ("path type directory … must match
 * frontmatter type") — path vocabulary for a candidate that has no path —
 * while `type/unknown`, the diagnostic `propose_record` returns, never ran.
 *
 * Overlaid onto the parsed value only, never `raw`: byte-offset diagnostics
 * (secret lint's `/body#Ln`) must keep pointing at the caller's own bytes.
 */
function withDeclaredType(value, type) {
    if (!isPlainObject(value))
        return value;
    if (value.type === type)
        return value;
    return { ...value, type };
}
/**
 * Validate a single in-memory candidate record (full markdown incl.
 * frontmatter) against a target repo's live catalog. Used by `validate_record`
 * and `propose_record` (docs/issues/0016) so an agent can check a draft before
 * it is ever written to disk.
 *
 * This is an *adapter*, not a second engine: it runs the same `pipeline.ts`
 * phases `validateFiles` runs (ADR-0002 — an agent whose proposal passes
 * `validate_record` but fails CI is the exact failure the shared core exists
 * to prevent). All it supplies is what genuinely differs — a record that has
 * no file on disk, overlaid on the repo's real parsed files so repo-level
 * rules can still ask cross-file questions of it, and `skipRules` for the two
 * rules that need a real placement in the tree unless `options.scope` lets us
 * derive one.
 *
 * "Same phases" means ALL of them, config included (docs/issues/0083). The
 * Lore Config phase used to be skipped here, so `config/owner-unmapped` — the
 * one config rule that anchors on a record — could not reach an author before
 * their record was canon: proposals validated clean and `lore validate` over
 * canon reported the unmapped owners afterwards. Config diagnostics anchored
 * on the *repo's* own `.lore/` files are still filtered out; they are never
 * the candidate's fault.
 */
export async function validateCandidate(repoRoot, type, content, options = {}) {
    const raw = content;
    const parsed = parseFrontmatter(raw);
    const submittedType = readField(parsed.value, ['type']);
    const overlaid = withDeclaredType(withAssignedId(parsed.value), type);
    const frontmatter = overlaid === parsed.value ? parsed : { ...parsed, value: overlaid };
    const derivation = deriveCandidatePath(type, options.scope, frontmatter.value);
    const derivedPath = derivation.path;
    const candidateFile = derivedPath ?? placeholderFile(type);
    // Without a derivable path, the rules that check where a record sits (and
    // what id it occupies) have nothing to check against — skip them, and say so.
    const phase = derivedPath ? {} : { skipRules: PATH_DEPENDENT_RULE_NAMES };
    const ctx = { file: candidateFile, raw, frontmatter };
    const diagnostics = runRecordRules(ctx, phase);
    // Say so when the argument silently won over what the caller wrote, naming
    // both values — the propose path overwrites the field without a word, and a
    // caller who never sees which type was actually judged cannot tell a typo'd
    // argument from a typo'd record (docs/issues/0083).
    if (isNonEmptyString(submittedType) && submittedType !== type) {
        diagnostics.push({
            rule: 'candidate/type-overridden',
            severity: 'warning',
            file: candidateFile,
            pointer: '/type',
            message: `This candidate declares \`type: ${submittedType}\`, but it was submitted as type "${type}" — the submitted type wins ` +
                `(propose_record overwrites the field with it), so it was validated as "${type}".`,
        });
    }
    if (derivation.reason) {
        diagnostics.push(pathDerivationDiagnostic(derivation.reason, candidateFile));
    }
    if (frontmatter.missing || frontmatter.error) {
        return { diagnostics, summary: summarize(diagnostics, 1) };
    }
    // The repo-level phase runs against the live catalog with this candidate
    // overlaid on it — that's the whole point: type resolution, link integrity
    // and ULID uniqueness are questions you can only ask of a record *in* a repo.
    // Then keep only what the candidate itself is answerable for.
    const repoFiles = await discoverRecords(repoRoot);
    const repoContexts = await loadRepoContexts(repoRoot, repoFiles);
    repoContexts.push({ file: candidateFile, frontmatter: frontmatter.value, raw });
    const repoDiagnostics = runRepoRules(repoContexts, [...repoFiles, candidateFile], phase);
    diagnostics.push(...repoDiagnostics.filter((d) => d.file === candidateFile));
    // Lore Config sanity over the same overlaid catalog, filtered the same way:
    // `config/owner-unmapped` is what an author needs to hear about their own
    // candidate, while the repo's pre-existing `.lore/` diagnostics are never
    // the candidate's fault (docs/issues/0083).
    const configDiagnostics = runConfigRules(await readLoreConfigFiles(repoRoot), repoContexts, phase);
    diagnostics.push(...configDiagnostics.filter((d) => d.file === candidateFile));
    return { diagnostics, summary: summarize(diagnostics, 1) };
}
/** An unsluggable title is the caller's *error* — nothing else can name the file, and the old fallback picked `record.md` for them without a word. */
function pathDerivationDiagnostic(reason, file) {
    if (reason.kind === 'empty-slug') {
        return {
            rule: 'candidate/slug-empty',
            severity: 'error',
            file,
            pointer: '/title',
            message: `Title "${reason.title}" has no characters a filename can be built from (letters and digits, after transliteration), ` +
                'so this candidate has no derivable path. Give it a title containing at least one ASCII letter or digit.',
        };
    }
    const detail = reason.kind === 'no-scope'
        ? 'No `scope` was supplied for this candidate'
        : reason.kind === 'bad-scope'
            ? `Scope "${reason.scope}" is not a scope (expected \`org\`, \`product:<slug>\`, or \`team:<slug>\`)`
            : 'This candidate has no frontmatter `title` to slug';
    return {
        rule: 'candidate/path-not-derivable',
        severity: 'warning',
        // `/x-lore` for the scope reasons: scope is an argument, never a
        // frontmatter field (ADR-0001), so the record itself is the only anchor.
        pointer: reason.kind === 'no-title' ? '/title' : '/x-lore',
        file,
        message: `${detail}, so its would-be repo path could not be derived: record/placement and record/ulid-unique were skipped.` +
            (reason.kind === 'no-scope' ? ' Pass `scope` to check those too.' : ''),
    };
}
function deriveCandidatePath(type, scope, frontmatterValue) {
    if (!scope)
        return { reason: { kind: 'no-scope' } };
    const scopeInfo = resolveScope(scope);
    if (!scopeInfo)
        return { reason: { kind: 'bad-scope', scope } };
    const title = readField(frontmatterValue, ['title']);
    if (!isNonEmptyString(title))
        return { reason: { kind: 'no-title' } };
    const slug = slugify(title);
    if (!slug)
        return { reason: { kind: 'empty-slug', title } };
    return { path: `${scopeInfo.relativePath}/${type}/${slug}.md` };
}
//# sourceMappingURL=validateCandidate.js.map