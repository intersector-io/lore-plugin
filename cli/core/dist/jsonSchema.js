/**
 * Minimal JSON Schema subset validator (docs/issues/0003-type-records-catalog.md).
 *
 * Deliberately small: `type`, `required`, `properties`, `enum`, `items`,
 * `format: date`. No heavy ajv dependency — Type Record schemas only ever
 * describe a flat-ish `x-type` extras block, so this subset is sufficient.
 */
import { isIsoDate } from './rules/fieldHelpers.js';
export function validateAgainstSchema(schema, value, pointer = '') {
    const violations = [];
    if (schema.type !== undefined) {
        const types = Array.isArray(schema.type) ? schema.type : [schema.type];
        if (!types.some((t) => matchesType(value, t))) {
            violations.push({
                pointer,
                message: `must be of type ${types.join(' or ')}: got ${describeValue(value)}`,
            });
            return violations;
        }
    }
    if (schema.enum !== undefined && !schema.enum.some((entry) => deepEqual(entry, value))) {
        violations.push({
            pointer,
            message: `must be one of ${schema.enum.map((e) => JSON.stringify(e)).join(', ')}: got ${describeValue(value)}`,
        });
    }
    if (schema.format === 'date' && typeof value === 'string' && !isIsoDate(value)) {
        violations.push({ pointer, message: `must match date format (YYYY-MM-DD): got "${value}"` });
    }
    const isObjectSchema = schema.type === 'object' || (schema.type === undefined && schema.properties !== undefined);
    if (isObjectSchema) {
        const obj = isPlainObject(value) ? value : {};
        for (const requiredKey of schema.required ?? []) {
            if (!(requiredKey in obj)) {
                violations.push({ pointer: `${pointer}/${requiredKey}`, message: `required property "${requiredKey}" is missing` });
            }
        }
        if (schema.properties) {
            for (const [key, subSchema] of Object.entries(schema.properties)) {
                if (key in obj) {
                    violations.push(...validateAgainstSchema(subSchema, obj[key], `${pointer}/${key}`));
                }
            }
        }
    }
    if (schema.type === 'array' && schema.items && Array.isArray(value)) {
        value.forEach((item, i) => {
            violations.push(...validateAgainstSchema(schema.items, item, `${pointer}/${i}`));
        });
    }
    return violations;
}
function matchesType(value, type) {
    switch (type) {
        case 'object':
            return isPlainObject(value);
        case 'array':
            return Array.isArray(value);
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number';
        case 'integer':
            return typeof value === 'number' && Number.isInteger(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'null':
            return value === null;
        default:
            return true;
    }
}
function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function describeValue(value) {
    if (value === undefined)
        return 'undefined';
    return JSON.stringify(value);
}
function deepEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}
//# sourceMappingURL=jsonSchema.js.map