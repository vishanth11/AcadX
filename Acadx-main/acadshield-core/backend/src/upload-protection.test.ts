import net from "node:net";
import { protectDocument, unprotectDocument, scanDocument } from "./upload-protection";

const original = { ...process.env };
afterEach(() => { process.env = { ...original }; });
it("encrypts with random nonces, round trips, and rejects tampering", () => {
  process.env.DOCUMENT_ENCRYPTION_KEY = "ab".repeat(32);
  const input = Buffer.from("private academic document");
  const encrypted = protectDocument(input);
  expect(encrypted.includes(input)).toBe(false);
  expect(encrypted.equals(protectDocument(input))).toBe(false);
  expect(unprotectDocument(encrypted)).toEqual(input);
  encrypted[encrypted.length - 1] ^= 1;
  expect(() => unprotectDocument(encrypted)).toThrow();
});
it("fails closed in production even with the development bypass", async () => {
  process.env.NODE_ENV = "production";
  process.env.ALLOW_UNSCANNED_UPLOADS = "true";
  delete process.env.CLAMAV_HOST; delete process.env.DOCUMENT_ENCRYPTION_KEY;
  await expect(scanDocument(Buffer.from("file"))).rejects.toThrow("NOT_CONFIGURED");
  expect(() => protectDocument(Buffer.from("file"))).toThrow("NOT_CONFIGURED");
});
it.each([['stream: OK\0', true], ['stream: Eicar-Test FOUND\0', false], ['stream: ERROR\0', false]])("handles scanner response %s", async (reply, clean) => {
  const server = net.createServer(socket => socket.once("data", data => {
    expect(data.subarray(0, 10).toString()).toBe("zINSTREAM\0");
    socket.end(reply);
  }));
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  process.env.CLAMAV_HOST = "127.0.0.1";
  process.env.CLAMAV_PORT = String((server.address() as net.AddressInfo).port);
  try {
    if (clean) await expect(scanDocument(Buffer.from("example"))).resolves.toBe("CLEAN");
    else await expect(scanDocument(Buffer.from("example"))).rejects.toThrow(/^MALWARE_/);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
