/**
 * The OKF 0.2 actor convention (issue 0101), in ONE place: identities in
 * `generated.by` are `human:<id>` for people, `process:<id>` for automated
 * processes, or `<producer>/<version>` for agents/tools. Every write path
 * builds its stamp through these helpers and `record/generated-format`
 * validates the same grammar, so the convention cannot drift per call site.
 */
/** A person, identified by the corporate identity lore uses everywhere (owners, trailers, provenance). */
export function humanActor(id) {
    return `human:${id}`;
}
export function processActor(name) {
    return `process:${name}`;
}
/** The harvester's actor — bulk code extraction is process-authored; the human stays accountable via provenance.onBehalfOf. */
export const HARVESTER_ACTOR = processActor('lore-harvester');
/** `human:<id>` | `process:<id>` | `<producer>/<version>` — the shapes `record/generated-format` accepts for `generated.by`. */
export const ACTOR_PATTERN = /^(human:.+|process:.+|[^:/\s]+\/.+)$/;
/** The OKF 0.2 `generated` frontmatter value for one meaningful change: who, and when. */
export function generatedStamp(by, at) {
    return { by, at: at.toISOString() };
}
//# sourceMappingURL=actor.js.map