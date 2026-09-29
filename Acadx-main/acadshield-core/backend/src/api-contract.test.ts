import request from "supertest";
import { apiContract } from "./api-contract";
import { app } from "./server";
jest.mock("@prisma/client", () => ({ ...jest.requireActual("@prisma/client"), PrismaClient: jest.fn(() => ({})) }));
it("publishes a versioned contract whose operations exist in Express", async () => {
  const response = await request(app).get("/api/v1/openapi.json");
  expect(response.status).toBe(200); expect(response.body.openapi).toBe("3.0.3");
  for (const [path, methods] of Object.entries(apiContract.paths)) {
    const routePath = `/api/v1${path.replace(/\{([^}]+)\}/g, ":$1")}`;
    for (const method of Object.keys(methods)) {
      expect(app._router.stack.some((layer: { route?: { path: string; methods: Record<string, boolean> } }) => layer.route?.path === routePath && layer.route.methods[method])).toBe(true);
    }
  }
});
