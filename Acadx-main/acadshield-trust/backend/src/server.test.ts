import request from "supertest";
import { app } from "./server";

describe("Trust API", () => {
  it("reports liveness without depending on database configuration", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "UP", service: "acadshield-trust-api" });
  });

  it("does not allow unauthenticated verification requests", async () => {
    const response = await request(app).post("/api/v1/verify/credential");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("UNAUTHORIZED");
  });
});
