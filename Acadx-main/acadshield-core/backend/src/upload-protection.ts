import crypto from "node:crypto";
import net from "node:net";

// Versioned envelope. Keys stay outside the database and document directory.
const magic = Buffer.from("ACADXENC1");
export function protectDocument(bytes: Buffer): Buffer {
  const hex = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (!hex) {
    if (process.env.NODE_ENV === "production") throw new Error("DOCUMENT_ENCRYPTION_NOT_CONFIGURED");
    return bytes;
  }
  if (!/^[a-f0-9]{64}$/i.test(hex)) throw new Error("DOCUMENT_ENCRYPTION_KEY_INVALID");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(hex, "hex"), iv);
  cipher.setAAD(magic);
  const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return Buffer.concat([magic, iv, cipher.getAuthTag(), ciphertext]);
}

export function unprotectDocument(bytes: Buffer): Buffer {
  if (!bytes.subarray(0, magic.length).equals(magic)) {
    if (process.env.NODE_ENV === "production") throw new Error("LEGACY_PLAINTEXT_DOCUMENT");
    return bytes;
  }
  const hex = process.env.DOCUMENT_ENCRYPTION_KEY || "";
  if (!/^[a-f0-9]{64}$/i.test(hex)) throw new Error("DOCUMENT_ENCRYPTION_KEY_INVALID");
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(hex, "hex"), bytes.subarray(9, 21));
  decipher.setAAD(magic);
  decipher.setAuthTag(bytes.subarray(21, 37));
  return Buffer.concat([decipher.update(bytes.subarray(37)), decipher.final()]);
}

export async function scanDocument(bytes: Buffer): Promise<"CLEAN" | "DEV_BYPASS"> {
  const host = process.env.CLAMAV_HOST;
  if (!host) {
    if (process.env.NODE_ENV !== "production" && process.env.ALLOW_UNSCANNED_UPLOADS === "true") return "DEV_BYPASS";
    throw new Error("MALWARE_SCANNER_NOT_CONFIGURED");
  }
  const port = Number(process.env.CLAMAV_PORT || 3310);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("MALWARE_SCANNER_NOT_CONFIGURED");
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    let response = "";
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true; clearTimeout(timer); socket.destroy();
      if (error) reject(error); else resolve("CLEAN");
    };
    const timer = setTimeout(() => finish(new Error("MALWARE_SCANNER_UNAVAILABLE")), 15_000);
    socket.on("error", () => finish(new Error("MALWARE_SCANNER_UNAVAILABLE")));
    socket.on("end", () => { if (!settled) finish(new Error("MALWARE_SCANNER_INVALID_RESPONSE")); });
    socket.on("data", (chunk) => {
      response += chunk.toString("utf8");
      if (response.length > 4096) { finish(new Error("MALWARE_SCANNER_INVALID_RESPONSE")); return; }
      if (!response.includes("\0") && !response.includes("\n")) return;
      const result = response.replace(/[\0\r\n]+$/, "");
      if (result === "stream: OK") finish();
      else finish(new Error(result.endsWith(" FOUND") ? "MALWARE_DETECTED" : "MALWARE_SCANNER_INVALID_RESPONSE"));
    });
    socket.on("connect", () => {
      socket.write("zINSTREAM\0");
      for (let offset = 0; offset < bytes.length; offset += 65536) {
        const chunk = bytes.subarray(offset, offset + 65536);
        const size = Buffer.alloc(4); size.writeUInt32BE(chunk.length);
        socket.write(size); socket.write(chunk);
      }
      socket.write(Buffer.alloc(4));
    });
  });
}
