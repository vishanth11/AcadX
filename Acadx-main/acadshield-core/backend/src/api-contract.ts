// Focused OpenAPI contract for the Phase 2/3 surfaces. Existing endpoints remain
// documented in the README; this intentionally does not pretend to cover them.
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object) => ({ "application/json": { schema } });
const error = { description: "Request rejected; no success is implied", content: json(ref("Error")) };
const response = (schema: object) => ({ description: "Success", content: json(schema) });
const secured = [{ sessionCookie: [] }, { bearerSession: [] }];
const id = { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } };
const cursor = { name: "cursor", in: "query", schema: { type: "string" }, description: "Opaque nextCursor from the previous response; keep the same filters." };
const pageResponses = { "200": response(ref("Page")), "400": error, "401": error, "403": error, "500": error };
const body = (schema: object) => ({ required: true, content: json(schema) });
export const apiContract = {
  openapi: "3.0.3", info: { title: "ACADSHIELD X security and sharing APIs", version: "1.0.0", description: "Phase 2/3 additions. Cookie writes require an allowed Origin. Production uploads require encryption and malware scanning. Reports are historical; shares are summaries, not proof of authenticity." },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: { sessionCookie: { type: "apiKey", in: "cookie", name: "acadshield_session" }, bearerSession: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: {
      Error: { type: "object", required: ["error"], properties: { error: { type: "string" }, operationId: { type: "string", format: "uuid" } } },
      Page: { type: "object", required: ["records"], properties: { records: { type: "array", items: { type: "object", additionalProperties: true } }, nextCursor: { type: "string", nullable: true }, limit: { type: "integer", maximum: 100 } } },
      ShareRequest: { type: "object", additionalProperties: false, required: ["credentialIds", "purpose", "expiresAt", "consent"], properties: {
        credentialIds: { type: "array", minItems: 1, maxItems: 20, uniqueItems: true, items: { type: "string", format: "uuid" } }, purpose: { type: "string", minLength: 5, maxLength: 200 }, expiresAt: { type: "string", format: "date-time", description: "Future date, no more than 30 days away" }, consent: { type: "boolean", enum: [true] },
      } },
      Operation: { type: "object", required: ["operationId", "status"], properties: { operationId: { type: "string", format: "uuid" }, status: { type: "string", enum: ["PENDING", "CONFIRMED", "FAILED"] }, transactionHash: { type: "string" } } },
    },
  },
  paths: {
    "/registry/{resource}": { get: { summary: "Institution-scoped registry (ADMIN or UNIVERSITY)", security: secured, parameters: [{ name: "resource", in: "path", required: true, schema: { type: "string", enum: ["documents", "credentials", "audit", "verifications", "institutions"] } }, cursor, { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } }, { name: "documentId", in: "query", schema: { type: "string", format: "uuid" } }], responses: { ...pageResponses, "404": error } } },
    "/students": { post: { summary: "Institution-authorized student enrollment (UNIVERSITY)", security: secured, requestBody: body({ type: "object", additionalProperties: false, required: ["email", "password", "subjectReference"], properties: { email: { type: "string", format: "email", maxLength: 254 }, password: { type: "string", minLength: 12, maxLength: 72, writeOnly: true }, subjectReference: { type: "string", pattern: "^did:", maxLength: 160 } } }), responses: { "201": response({ type: "object" }), "400": error, "401": error, "403": error, "409": error, "500": error } } },
    "/student/credentials": { get: { summary: "Enrolled student's credential summaries", security: secured, parameters: [cursor], responses: pageResponses } },
    "/student/shares": {
      get: { summary: "Student's sharing history (tokens never returned)", security: secured, parameters: [cursor], responses: pageResponses },
      post: { summary: "Grant consent and create an expiring bearer link", security: secured, requestBody: body(ref("ShareRequest")), responses: { "201": response({ type: "object", required: ["id", "token"], properties: { id: { type: "string", format: "uuid" }, token: { type: "string", description: "Returned only once; keep private. Use in a URL fragment, not path/query." } } }), "400": error, "401": error, "403": error, "500": error } },
    },
    "/student/shares/{id}/revoke": { post: { summary: "Revoke own share", security: secured, parameters: [id], responses: { "200": response({ type: "object" }), "400": error, "401": error, "403": error, "404": error, "500": error } } },
    "/shares/resolve": { post: { summary: "Resolve a private capability to minimal live summaries", requestBody: body({ type: "object", additionalProperties: false, required: ["token"], properties: { token: { type: "string", pattern: "^[A-Za-z0-9_-]{43}$" } } }), responses: { "200": response(ref("Page")), "400": error, "404": error, "429": error, "500": error } } },
    "/company/reports": { get: { summary: "Company-scoped verification report list", security: secured, parameters: [cursor, ...["from", "to"].map(name => ({ name, in: "query", schema: { type: "string", format: "date-time" } }))], responses: pageResponses } },
    "/company/reports/{id}": { get: { summary: "Download company-scoped historical JSON evidence", security: secured, parameters: [id], responses: { "200": response({ type: "object", required: ["schemaVersion", "generatedAt", "verification", "note"] }), "401": error, "403": error, "404": error, "500": error } } },
    "/credential-operations": { get: { summary: "Oldest 100 pending institution operations; reconcile and refresh", security: secured, responses: pageResponses } },
    "/credential-operations/{id}/reconcile": { post: { summary: "Check or rebroadcast saved transaction (UNIVERSITY)", security: secured, parameters: [id], responses: { "200": response(ref("Operation")), "202": response(ref("Operation")), "401": error, "403": error, "404": error, "503": error, "500": error } } },
  },
};
