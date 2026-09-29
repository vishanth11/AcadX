import "dotenv/config";
import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

// Run off the request path. Default is a dry run; the grace period is longer
// than the bounded upload/analysis request and protects in-flight files.
export async function reconcileUploads(prisma: PrismaClient, root: string, apply = false, now = Date.now()) {
  const storage = path.resolve(root);
  const cutoff = new Date(now - 24 * 60 * 60 * 1000);
  const result = { orphanFiles: [] as string[], staleRows: [] as string[], applied: apply };
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let directories: Dirent[];
  try { directories = await fs.readdir(storage, { withFileTypes: true }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") directories = []; else throw error; }
  for (const directory of directories) {
    if (!directory.isDirectory() || !uuid.test(directory.name)) continue;
    const folder = path.join(storage, directory.name);
    for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".bin") || !uuid.test(entry.name.slice(0, -4))) continue;
      const file = path.resolve(folder, entry.name);
      const relative = path.relative(storage, file);
      if (relative.startsWith("..") || path.isAbsolute(relative)) continue;
      const stat = await fs.lstat(file);
      if (!stat.isFile() || stat.mtime >= cutoff) continue;
      const row = await prisma.academicDocument.findFirst({ where: { OR: [{ id: entry.name.slice(0, -4) }, { storageReference: file }] }, select: { id: true } });
      if (row) continue;
      result.orphanFiles.push(relative);
      if (apply) await fs.unlink(file);
    }
  }
  const stale = await prisma.academicDocument.findMany({ where: { status: "PROCESSING", updatedAt: { lt: cutoff } }, select: { id: true } });
  for (const row of stale) {
    result.staleRows.push(row.id);
    if (apply) await prisma.academicDocument.updateMany({
      where: { id: row.id, status: "PROCESSING", updatedAt: { lt: cutoff } },
      data: { status: "FAILED", analysisEvidence: { status: "FAILED", reason: "STALE_PROCESSING_RECONCILED" } },
    });
  }
  return result;
}

if (require.main === module) {
  const prisma = new PrismaClient();
  reconcileUploads(prisma, process.env.DOCUMENT_STORAGE_DIR || "storage/documents", process.argv.includes("--apply"))
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => { console.error("Reconciliation failed", error instanceof Error ? error.name : "unknown"); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
