import express from "express";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { registerRegistryRoutes } from "./registry-routes";

it("validates pagination and returns a bounded next cursor", async () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const findMany = jest.fn().mockResolvedValue([{ id }, { id: "next" }]);
  const app = express();
  registerRegistryRoutes(app, { academicDocument: { findMany } } as unknown as PrismaClient, (req, _res, next) => { Object.assign(req, { session: { role: "ADMIN" } }); next(); });
  expect((await request(app).get("/api/v1/registry/documents?limit=101")).status).toBe(400);
  expect((await request(app).get("/api/v1/registry/documents?cursor=bad")).status).toBe(400);
  const response = await request(app).get("/api/v1/registry/documents?limit=1");
  expect(response.body.records).toHaveLength(1); expect(response.body.nextCursor).toBe(id);
  await request(app).get(`/api/v1/registry/documents?limit=1&cursor=${id}`);
  expect(findMany).toHaveBeenLastCalledWith(expect.objectContaining({ take: 2, cursor: { id }, skip: 1 }));
});

it("scopes university lists, excludes storage paths, and denies admin-only resources", async () => {
  const findMany = jest.fn().mockResolvedValue([]);
  const client = { academicDocument: { findMany } } as unknown as PrismaClient;
  const app = express();
  registerRegistryRoutes(app, client, (req, _res, next) => { Object.assign(req, { session: { role: "UNIVERSITY", institutionId: "institution-a" } }); next(); });
  const response = await request(app).get("/api/v1/registry/documents");
  expect(response.status).toBe(200);
  expect(response.body.records).toEqual([]);
  expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { institutionId: "institution-a" } }));
  expect(findMany.mock.calls[0][0].select.storageReference).toBeUndefined();
  expect((await request(app).get("/api/v1/registry/verifications")).status).toBe(403);
});
it("looks up the exact credential inside the institution and never substitutes a first record", async () => {
  const findFirst = jest.fn().mockResolvedValue(null);
  const client = { credential: { findFirst } } as unknown as PrismaClient;
  const app = express();
  registerRegistryRoutes(app, client, (req, _res, next) => { Object.assign(req, { session: { role: "UNIVERSITY", institutionId: "institution-a" } }); next(); });
  const id = "00000000-0000-4000-8000-000000000001";
  expect((await request(app).get(`/api/v1/registry/credentials/${id}`)).status).toBe(404);
  expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id, institutionId: "institution-a" } }));
});
