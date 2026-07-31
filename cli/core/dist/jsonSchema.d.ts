export interface JsonSchemaLike {
    type?: string | string[];
    required?: string[];
    properties?: Record<string, JsonSchemaLike>;
    enum?: unknown[];
    items?: JsonSchemaLike;
    format?: string;
}
export interface SchemaViolation {
    pointer: string;
    message: string;
}
export declare function validateAgainstSchema(schema: JsonSchemaLike, value: unknown, pointer?: string): SchemaViolation[];
//# sourceMappingURL=jsonSchema.d.ts.map