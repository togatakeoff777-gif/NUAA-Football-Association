import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { createClient } from "@libsql/client";

const execFileAsync = promisify(execFile);
export const combinedBackupFormatVersion = 2 as const;

export type CombinedBackupManifest = {
  formatVersion: 2;
  generatedAtUtc: string;
  applicationSha: string;
  schemaVersion: string;
  migrations: string[];
  database: { filename: string; bytes: number; sha256: string };
  uploads: { fileCount: number; totalBytes: number; mediaAssetCount: number; files: Array<{ storageKey: string; bytes: number; sha256: string }> };
  checksums: Record<string, string>;
};

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function sqlitePathFromUrl(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) throw new Error("DATABASE_URL must be an explicit file: SQLite URL.");
  const value = databaseUrl.slice("file:".length);
  if (!value || value.includes("?") || value.includes("#")) throw new Error("SQLite URL must identify one plain database file.");
  return path.resolve(value.replaceAll("/", path.sep));
}

async function listFiles(root: string, current = root): Promise<Array<{ storageKey: string; diskPath: string }>> {
  const entries = await readdir(current, { withFileTypes: true });
  const result: Array<{ storageKey: string; diskPath: string }> = [];
  for (const entry of entries) {
    if (entry.name === ".staging") continue;
    const target = path.join(current, entry.name);
    if (entry.isDirectory()) result.push(...await listFiles(root, target));
    else if (entry.isFile()) result.push({ storageKey: path.relative(root, target).split(path.sep).join("/"), diskPath: target });
  }
  return result;
}

async function migrationNames() {
  return (await readdir(path.resolve("prisma/migrations"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

async function applicationSha() {
  return (await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: process.cwd() })).stdout.trim();
}

async function ensureEmptyDirectory(target: string) {
  await mkdir(target, { recursive: true });
  if ((await readdir(target)).length) throw new Error("Backup output directory must be empty.");
}

export async function createCombinedBackup(input: { databaseUrl: string; uploadRoot: string; outputDirectory: string; generatedAt?: Date }) {
  const databasePath = sqlitePathFromUrl(input.databaseUrl);
  const uploadRoot = path.resolve(input.uploadRoot);
  const outputDirectory = path.resolve(input.outputDirectory);
  if (!path.isAbsolute(input.uploadRoot) || outputDirectory === uploadRoot || outputDirectory.startsWith(`${uploadRoot}${path.sep}`)) {
    throw new Error("Backup output must be an absolute directory outside the upload root.");
  }
  if (!(await stat(databasePath)).isFile()) throw new Error("SQLite database file does not exist.");
  await ensureEmptyDirectory(outputDirectory);
  const databaseOutput = path.join(outputDirectory, "database.sqlite");
  const uploadsOutput = path.join(outputDirectory, "uploads");
  await mkdir(uploadsOutput, { recursive: true });

  const client = createClient({ url: input.databaseUrl });
  let mediaRows: Array<{ storageKey: string }>;
  try {
    const result = await client.execute('SELECT "storageKey" FROM "MediaAsset" ORDER BY "storageKey"');
    mediaRows = result.rows.map((row) => ({ storageKey: String(row.storageKey) }));
    const escaped = databaseOutput.replaceAll("\\", "/").replaceAll("'", "''");
    await client.execute(`VACUUM INTO '${escaped}'`);
  } finally {
    client.close();
  }

  const sourceFiles = await listFiles(uploadRoot);
  const expected = new Set(mediaRows.map((row) => row.storageKey));
  const actual = new Set(sourceFiles.map((file) => file.storageKey));
  const orphanFiles = sourceFiles.filter((file) => !expected.has(file.storageKey)).map((file) => file.storageKey);
  const missingFiles = mediaRows.filter((row) => !actual.has(row.storageKey)).map((row) => row.storageKey);
  if (orphanFiles.length || missingFiles.length) throw new Error(`Media reconciliation failed: ${orphanFiles.length} orphan, ${missingFiles.length} missing.`);

  const uploadFiles: CombinedBackupManifest["uploads"]["files"] = [];
  for (const source of sourceFiles) {
    const target = path.join(uploadsOutput, ...source.storageKey.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source.diskPath, target);
    const bytes = await readFile(target);
    uploadFiles.push({ storageKey: source.storageKey, bytes: bytes.length, sha256: sha256(bytes) });
  }
  const databaseBytes = await readFile(databaseOutput);
  const migrations = await migrationNames();
  const checksums: Record<string, string> = { "database.sqlite": sha256(databaseBytes) };
  for (const file of uploadFiles) checksums[`uploads/${file.storageKey}`] = file.sha256;
  const manifest: CombinedBackupManifest = {
    formatVersion: combinedBackupFormatVersion,
    generatedAtUtc: (input.generatedAt ?? new Date()).toISOString(),
    applicationSha: await applicationSha(),
    schemaVersion: migrations.at(-1) ?? "none",
    migrations,
    database: { filename: "database.sqlite", bytes: databaseBytes.length, sha256: checksums["database.sqlite"] },
    uploads: { fileCount: uploadFiles.length, totalBytes: uploadFiles.reduce((total, file) => total + file.bytes, 0), mediaAssetCount: mediaRows.length, files: uploadFiles },
    checksums,
  };
  await writeFile(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
  return manifest;
}

export async function readAndVerifyCombinedBackup(backupDirectory: string) {
  const root = path.resolve(backupDirectory);
  const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8")) as CombinedBackupManifest;
  if (manifest.formatVersion !== combinedBackupFormatVersion || !/^[0-9a-f]{40}$/i.test(manifest.applicationSha)) throw new Error("Backup manifest format is invalid.");
  for (const [relative, expected] of Object.entries(manifest.checksums)) {
    const target = path.resolve(root, ...relative.split("/"));
    if (!target.startsWith(`${root}${path.sep}`)) throw new Error("Backup manifest contains an unsafe path.");
    let bytes: Uint8Array;
    try { bytes = await readFile(target); } catch { throw new Error(`Backup file is missing: ${relative}`); }
    if (sha256(bytes) !== expected) throw new Error(`Backup checksum mismatch: ${relative}`);
  }
  return { root, manifest };
}

function assertRestoreTarget(target: string, allowedRoot: string) {
  const resolved = path.resolve(target);
  const root = path.resolve(allowedRoot);
  if (resolved === root || !resolved.startsWith(`${root}${path.sep}`)) throw new Error("Restore target is outside the explicitly allowed isolated root.");
  return resolved;
}

export async function restoreCombinedBackup(input: { backupDirectory: string; databasePath: string; uploadRoot: string; allowedTargetRoot: string }) {
  const { root, manifest } = await readAndVerifyCombinedBackup(input.backupDirectory);
  const databasePath = assertRestoreTarget(input.databasePath, input.allowedTargetRoot);
  const uploadRoot = assertRestoreTarget(input.uploadRoot, input.allowedTargetRoot);
  await rm(databasePath, { force: true });
  await rm(`${databasePath}-wal`, { force: true });
  await rm(`${databasePath}-shm`, { force: true });
  await rm(uploadRoot, { recursive: true, force: true });
  await mkdir(path.dirname(databasePath), { recursive: true });
  await mkdir(uploadRoot, { recursive: true });
  await copyFile(path.join(root, manifest.database.filename), databasePath);
  for (const file of manifest.uploads.files) {
    const target = path.join(uploadRoot, ...file.storageKey.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(root, "uploads", ...file.storageKey.split("/")), target);
  }
  const url = `file:${databasePath.replaceAll("\\", "/")}`;
  const client = createClient({ url });
  try {
    const integrity = await client.execute("PRAGMA integrity_check");
    if (integrity.rows[0]?.integrity_check !== "ok") throw new Error("Restored database integrity_check failed.");
    const foreignKeys = await client.execute("PRAGMA foreign_key_check");
    if (foreignKeys.rows.length) throw new Error("Restored database foreign_key_check failed.");
    const result = await client.execute('SELECT "storageKey" FROM "MediaAsset" ORDER BY "storageKey"');
    const keys = result.rows.map((row) => String(row.storageKey));
    const files = await listFiles(uploadRoot);
    if (keys.join("\n") !== files.map((file) => file.storageKey).sort().join("\n")) throw new Error("Restored MediaAsset/file reconciliation failed.");
    return { integrityCheck: "ok", foreignKeyViolations: 0, mediaAssetCount: keys.length, uploadFileCount: files.length };
  } finally { client.close(); }
}
