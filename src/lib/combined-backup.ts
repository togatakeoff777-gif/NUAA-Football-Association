import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { createClient } from "@libsql/client";

const execFileAsync = promisify(execFile);
export const combinedBackupFormatVersion = 3 as const;
export const combinedBackupCompletionFilename = "COMPLETED.json";
const manifestFilename = "manifest.json";
const databaseFilename = "database.sqlite";

export const protectedBusinessTables = [
  "Competition",
  "Team",
  "Match",
  "Referee",
  "RefereeApplication",
  "RefereeAppointment",
  "AppointmentVersion",
  "RefereeAvailability",
  "RefereePositionCapability",
  "RefereeAdmissionApplication",
  "ContentPost",
  "MediaAsset",
  "AdminAccount",
  "AuditLog",
] as const;

export type CombinedBackupManifest = {
  formatVersion: 3;
  backupId: string;
  generatedAtUtc: string;
  applicationSha: string;
  schemaVersion: string;
  migrations: string[];
  database: { filename: "database.sqlite"; bytes: number; sha256: string };
  uploads: {
    fileCount: number;
    totalBytes: number;
    mediaAssetCount: number;
    files: Array<{ storageKey: string; bytes: number; sha256: string }>;
  };
  checksums: Record<string, string>;
};

export type CombinedBackupCompletion = {
  formatVersion: 1;
  backupId: string;
  completedAtUtc: string;
  manifestSha256: string;
};

export type CombinedBackupPhase =
  | "database-snapshot-complete"
  | "uploads-copy-complete"
  | "manifest-complete"
  | "completion-publish";

const storageKeyPattern = /^[0-9]{4}\/[0-9]{2}\/[0-9a-f-]+\.(?:jpg|jpeg|png|webp|pdf)$/;
const sha256Pattern = /^[0-9a-f]{64}$/i;
const backupIdPattern = /^nuaafa-[0-9]{8}T[0-9]{6}Z-[0-9a-f]{12}$/;

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeArtifactPath(root: string, relative: string) {
  if (!relative || relative.includes("\\") || path.posix.isAbsolute(relative)) {
    throw new Error("Backup manifest contains an unsafe path.");
  }
  const segments = relative.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error("Backup manifest contains an unsafe path.");
  }
  const target = path.resolve(root, ...segments);
  if (!target.startsWith(`${root}${path.sep}`)) {
    throw new Error("Backup manifest contains an unsafe path.");
  }
  return target;
}

function createBackupId(generatedAt: Date) {
  const timestamp = generatedAt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `nuaafa-${timestamp}-${randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

export function sqlitePathFromUrl(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("DATABASE_URL must be an explicit file: SQLite URL.");
  }
  const value = databaseUrl.slice("file:".length);
  if (!value || value.includes("?") || value.includes("#")) {
    throw new Error("SQLite URL must identify one plain database file.");
  }
  return path.resolve(value.replaceAll("/", path.sep));
}

async function listFiles(
  root: string,
  current = root,
  options: { allowStaging?: boolean } = {},
): Promise<Array<{ storageKey: string; diskPath: string; bytes: number }>> {
  const entries = await readdir(current, { withFileTypes: true });
  const result: Array<{ storageKey: string; diskPath: string; bytes: number }> = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not allowed in backup artifacts: ${entry.name}`);
    }
    if (entry.name === ".staging" && current === root && options.allowStaging) continue;
    const target = path.join(current, entry.name);
    if (entry.isDirectory()) {
      result.push(...await listFiles(root, target, options));
      continue;
    }
    if (!entry.isFile()) {
      throw new Error(`Unexpected filesystem entry in backup artifacts: ${entry.name}`);
    }
    const file = await stat(target);
    result.push({
      storageKey: path.relative(root, target).split(path.sep).join("/"),
      diskPath: target,
      bytes: file.size,
    });
  }
  return result;
}

async function migrationNames() {
  return (await readdir(path.resolve("prisma/migrations"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function applicationSha() {
  return (await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: process.cwd() })).stdout.trim();
}

async function ensureEmptyDirectory(target: string) {
  await mkdir(target, { recursive: true });
  if ((await readdir(target)).length) {
    throw new Error("Backup output directory must be empty.");
  }
}

function validateManifest(value: unknown): CombinedBackupManifest {
  if (!isRecord(value) || value.formatVersion !== combinedBackupFormatVersion) {
    throw new Error("Backup manifest format is invalid.");
  }
  if (
    typeof value.backupId !== "string" ||
    !backupIdPattern.test(value.backupId) ||
    typeof value.generatedAtUtc !== "string" ||
    Number.isNaN(Date.parse(value.generatedAtUtc)) ||
    typeof value.applicationSha !== "string" ||
    !/^[0-9a-f]{40}$/i.test(value.applicationSha) ||
    typeof value.schemaVersion !== "string" ||
    !Array.isArray(value.migrations) ||
    !value.migrations.every((item) => typeof item === "string" && /^[0-9A-Za-z_-]+$/.test(item))
  ) {
    throw new Error("Backup manifest metadata is invalid.");
  }
  if (!isRecord(value.database) || value.database.filename !== databaseFilename) {
    throw new Error("Backup manifest database artifact is invalid.");
  }
  if (
    typeof value.database.bytes !== "number" ||
    !Number.isSafeInteger(value.database.bytes) ||
    value.database.bytes <= 0 ||
    typeof value.database.sha256 !== "string" ||
    !sha256Pattern.test(value.database.sha256)
  ) {
    throw new Error("Backup manifest database metadata is invalid.");
  }
  if (!isRecord(value.uploads) || !Array.isArray(value.uploads.files)) {
    throw new Error("Backup manifest upload metadata is invalid.");
  }
  const counters = [value.uploads.fileCount, value.uploads.totalBytes, value.uploads.mediaAssetCount];
  if (counters.some((counter) => typeof counter !== "number" || !Number.isSafeInteger(counter) || counter < 0)) {
    throw new Error("Backup manifest upload counters are invalid.");
  }
  const seen = new Set<string>();
  let totalBytes = 0;
  for (const item of value.uploads.files) {
    if (
      !isRecord(item) ||
      typeof item.storageKey !== "string" ||
      !storageKeyPattern.test(item.storageKey) ||
      seen.has(item.storageKey) ||
      typeof item.bytes !== "number" ||
      !Number.isSafeInteger(item.bytes) ||
      item.bytes < 0 ||
      typeof item.sha256 !== "string" ||
      !sha256Pattern.test(item.sha256)
    ) {
      throw new Error("Backup manifest upload entry is invalid.");
    }
    seen.add(item.storageKey);
    totalBytes += item.bytes;
  }
  if (
    value.uploads.fileCount !== value.uploads.files.length ||
    value.uploads.mediaAssetCount !== value.uploads.files.length ||
    value.uploads.totalBytes !== totalBytes
  ) {
    throw new Error("Backup manifest upload counters do not reconcile.");
  }
  if (!isRecord(value.checksums)) {
    throw new Error("Backup manifest checksums are invalid.");
  }
  const checksumValues = value.checksums;
  const expectedChecksumNames = new Set([
    databaseFilename,
    ...value.uploads.files.map((file) => `uploads/${file.storageKey}`),
  ]);
  const actualChecksumNames = Object.keys(checksumValues);
  if (
    actualChecksumNames.length !== expectedChecksumNames.size ||
    actualChecksumNames.some((name) => !expectedChecksumNames.has(name))
  ) {
    throw new Error("Backup manifest checksum coverage is incomplete.");
  }
  for (const [name, checksum] of Object.entries(checksumValues)) {
    if (typeof checksum !== "string" || !sha256Pattern.test(checksum)) {
      throw new Error(`Backup manifest checksum is invalid: ${name}`);
    }
  }
  if (
    checksumValues[databaseFilename] !== value.database.sha256 ||
    value.uploads.files.some((file) => checksumValues[`uploads/${file.storageKey}`] !== file.sha256)
  ) {
    throw new Error("Backup manifest checksum metadata does not reconcile.");
  }
  return value as CombinedBackupManifest;
}

function validateCompletion(value: unknown, manifest: CombinedBackupManifest, manifestBytes: Uint8Array) {
  if (
    !isRecord(value) ||
    value.formatVersion !== 1 ||
    value.backupId !== manifest.backupId ||
    typeof value.completedAtUtc !== "string" ||
    Number.isNaN(Date.parse(value.completedAtUtc)) ||
    typeof value.manifestSha256 !== "string" ||
    value.manifestSha256 !== sha256(manifestBytes)
  ) {
    throw new Error("Backup completion marker is invalid.");
  }
  return value as CombinedBackupCompletion;
}

async function readJsonFile(target: string, label: string) {
  try {
    return JSON.parse(await readFile(target, "utf8")) as unknown;
  } catch {
    throw new Error(`${label} is missing or malformed.`);
  }
}

async function assertRegularFile(target: string, label: string) {
  let info;
  try {
    info = await lstat(target);
  } catch {
    throw new Error(`${label} is missing.`);
  }
  if (!info.isFile() || info.isSymbolicLink()) {
    throw new Error(`${label} must be a regular file.`);
  }
  return info;
}

async function databaseValidation(databasePath: string) {
  const url = `file:${databasePath.replaceAll("\\", "/")}`;
  const client = createClient({ url });
  try {
    const integrity = await client.execute("PRAGMA integrity_check");
    if (integrity.rows.length !== 1 || integrity.rows[0]?.integrity_check !== "ok") {
      throw new Error("Backup database integrity_check failed.");
    }
    const foreignKeys = await client.execute("PRAGMA foreign_key_check");
    if (foreignKeys.rows.length) {
      throw new Error("Backup database foreign_key_check failed.");
    }
    const rowCounts: Record<string, number> = {};
    for (const table of protectedBusinessTables) {
      const result = await client.execute(`SELECT COUNT(*) AS count FROM "${table}"`);
      rowCounts[table] = Number(result.rows[0]?.count ?? 0);
    }
    return { integrityCheck: "ok" as const, foreignKeyViolations: 0, rowCounts };
  } finally {
    client.close();
  }
}

export async function createCombinedBackup(input: {
  databaseUrl: string;
  uploadRoot: string;
  outputDirectory: string;
  generatedAt?: Date;
  onPhase?: (phase: CombinedBackupPhase) => void | Promise<void>;
}) {
  const databasePath = sqlitePathFromUrl(input.databaseUrl);
  const uploadRoot = path.resolve(input.uploadRoot);
  const outputDirectory = path.resolve(input.outputDirectory);
  if (
    !path.isAbsolute(input.uploadRoot) ||
    outputDirectory === uploadRoot ||
    outputDirectory.startsWith(`${uploadRoot}${path.sep}`)
  ) {
    throw new Error("Backup output must be an absolute directory outside the upload root.");
  }
  const databaseInfo = await stat(databasePath);
  if (!databaseInfo.isFile()) throw new Error("SQLite database file does not exist.");
  const uploadInfo = await lstat(uploadRoot);
  if (!uploadInfo.isDirectory() || uploadInfo.isSymbolicLink()) {
    throw new Error("Upload root must be a real directory.");
  }
  await ensureEmptyDirectory(outputDirectory);
  const databaseOutput = path.join(outputDirectory, databaseFilename);
  const uploadsOutput = path.join(outputDirectory, "uploads");
  await mkdir(uploadsOutput, { recursive: true });

  const client = createClient({ url: input.databaseUrl });
  try {
    const escaped = databaseOutput.replaceAll("\\", "/").replaceAll("'", "''");
    await client.execute(`VACUUM INTO '${escaped}'`);
  } finally {
    client.close();
  }
  await input.onPhase?.("database-snapshot-complete");

  const snapshotClient = createClient({ url: `file:${databaseOutput.replaceAll("\\", "/")}` });
  let mediaRows: Array<{ storageKey: string }>;
  try {
    const result = await snapshotClient.execute('SELECT "storageKey" FROM "MediaAsset" ORDER BY "storageKey"');
    mediaRows = result.rows.map((row) => ({ storageKey: String(row.storageKey) }));
  } finally {
    snapshotClient.close();
  }
  if (mediaRows.some((row) => !storageKeyPattern.test(row.storageKey))) {
    throw new Error("MediaAsset contains an invalid storage key.");
  }

  const sourceFiles = await listFiles(uploadRoot, uploadRoot, { allowStaging: true });
  const expected = new Set(mediaRows.map((row) => row.storageKey));
  const actual = new Set(sourceFiles.map((file) => file.storageKey));
  const orphanFiles = sourceFiles.filter((file) => !expected.has(file.storageKey)).map((file) => file.storageKey);
  const missingFiles = mediaRows.filter((row) => !actual.has(row.storageKey)).map((row) => row.storageKey);
  if (orphanFiles.length || missingFiles.length) {
    throw new Error(`Media reconciliation failed: ${orphanFiles.length} orphan, ${missingFiles.length} missing.`);
  }

  const uploadFiles: CombinedBackupManifest["uploads"]["files"] = [];
  for (const source of sourceFiles.sort((left, right) => left.storageKey.localeCompare(right.storageKey))) {
    const target = path.join(uploadsOutput, ...source.storageKey.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source.diskPath, target);
    const bytes = await readFile(target);
    if (bytes.length !== source.bytes) {
      throw new Error(`Upload changed during backup: ${source.storageKey}`);
    }
    uploadFiles.push({ storageKey: source.storageKey, bytes: bytes.length, sha256: sha256(bytes) });
  }
  await input.onPhase?.("uploads-copy-complete");

  const databaseBytes = await readFile(databaseOutput);
  const migrations = await migrationNames();
  const checksums: Record<string, string> = { [databaseFilename]: sha256(databaseBytes) };
  for (const file of uploadFiles) checksums[`uploads/${file.storageKey}`] = file.sha256;
  const generatedAt = input.generatedAt ?? new Date();
  const manifest: CombinedBackupManifest = {
    formatVersion: combinedBackupFormatVersion,
    backupId: createBackupId(generatedAt),
    generatedAtUtc: generatedAt.toISOString(),
    applicationSha: await applicationSha(),
    schemaVersion: migrations.at(-1) ?? "none",
    migrations,
    database: { filename: databaseFilename, bytes: databaseBytes.length, sha256: checksums[databaseFilename] },
    uploads: {
      fileCount: uploadFiles.length,
      totalBytes: uploadFiles.reduce((total, file) => total + file.bytes, 0),
      mediaAssetCount: mediaRows.length,
      files: uploadFiles,
    },
    checksums,
  };
  validateManifest(manifest);
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputDirectory, manifestFilename), manifestBytes, { flag: "wx", mode: 0o600 });
  await input.onPhase?.("manifest-complete");

  const completion: CombinedBackupCompletion = {
    formatVersion: 1,
    backupId: manifest.backupId,
    completedAtUtc: new Date().toISOString(),
    manifestSha256: sha256(manifestBytes),
  };
  const temporaryCompletion = path.join(outputDirectory, ".completion.tmp");
  await writeFile(temporaryCompletion, `${JSON.stringify(completion, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  await input.onPhase?.("completion-publish");
  await rename(temporaryCompletion, path.join(outputDirectory, combinedBackupCompletionFilename));
  return manifest;
}

type DatabaseValidation = Awaited<ReturnType<typeof databaseValidation>>;
type VerifiedBackupBase = {
  root: string;
  manifest: CombinedBackupManifest;
  completion: CombinedBackupCompletion;
};

export function readAndVerifyCombinedBackup(backupDirectory: string): Promise<VerifiedBackupBase & { database: DatabaseValidation }>;
export function readAndVerifyCombinedBackup(backupDirectory: string, options: { validateDatabase: false }): Promise<VerifiedBackupBase & { database: null }>;
export async function readAndVerifyCombinedBackup(backupDirectory: string, options: { validateDatabase?: boolean } = {}) {
  const root = path.resolve(backupDirectory);
  const rootInfo = await lstat(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
    throw new Error("Backup root must be a real directory.");
  }
  await assertRegularFile(path.join(root, combinedBackupCompletionFilename), "Backup completion marker");
  await assertRegularFile(path.join(root, manifestFilename), "Backup manifest");
  const manifestBytes = await readFile(path.join(root, manifestFilename));
  let manifestJson: unknown;
  try {
    manifestJson = JSON.parse(manifestBytes.toString("utf8"));
  } catch {
    throw new Error("Backup manifest is missing or malformed.");
  }
  const manifest = validateManifest(manifestJson);
  const completion = validateCompletion(
    await readJsonFile(path.join(root, combinedBackupCompletionFilename), "Backup completion marker"),
    manifest,
    manifestBytes,
  );

  for (const [relative, expected] of Object.entries(manifest.checksums)) {
    const target = safeArtifactPath(root, relative);
    const info = await assertRegularFile(target, `Backup file ${relative}`);
    const bytes = await readFile(target);
    if (sha256(bytes) !== expected) throw new Error(`Backup checksum mismatch: ${relative}`);
    const expectedBytes = relative === databaseFilename
      ? manifest.database.bytes
      : manifest.uploads.files.find((file) => `uploads/${file.storageKey}` === relative)?.bytes;
    if (expectedBytes === undefined || info.size !== expectedBytes || bytes.length !== expectedBytes) {
      throw new Error(`Backup artifact size mismatch: ${relative}`);
    }
  }

  const uploadRoot = path.join(root, "uploads");
  const uploadInfo = await lstat(uploadRoot);
  if (!uploadInfo.isDirectory() || uploadInfo.isSymbolicLink()) {
    throw new Error("Backup uploads artifact must be a real directory.");
  }
  const storedFiles = await listFiles(uploadRoot);
  const expectedFiles = manifest.uploads.files.map((file) => file.storageKey).sort();
  const actualFiles = storedFiles.map((file) => file.storageKey).sort();
  if (expectedFiles.join("\n") !== actualFiles.join("\n")) {
    throw new Error("Backup uploads artifact contains missing or unexpected files.");
  }
  const database = options.validateDatabase === false ? null : await databaseValidation(path.join(root, databaseFilename));
  return { root, manifest, completion, database };
}

function assertRestoreTarget(target: string, allowedRoot: string) {
  const resolved = path.resolve(target);
  const root = path.resolve(allowedRoot);
  if (resolved === root || !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Restore target is outside the explicitly allowed isolated root.");
  }
  return resolved;
}

async function targetMustNotExist(target: string, label: string) {
  try {
    await lstat(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  throw new Error(`${label} already exists; restore requires a fresh explicit destination.`);
}

export async function restoreCombinedBackup(input: {
  backupDirectory: string;
  databasePath: string;
  uploadRoot: string;
  allowedTargetRoot: string;
}) {
  const { root, manifest, database: sourceDatabase } = await readAndVerifyCombinedBackup(input.backupDirectory);
  const allowedTargetRoot = path.resolve(input.allowedTargetRoot);
  const databasePath = assertRestoreTarget(input.databasePath, allowedTargetRoot);
  const uploadRoot = assertRestoreTarget(input.uploadRoot, allowedTargetRoot);
  if (
    databasePath === uploadRoot ||
    databasePath.startsWith(`${uploadRoot}${path.sep}`) ||
    uploadRoot.startsWith(`${databasePath}${path.sep}`) ||
    databasePath.startsWith(`${root}${path.sep}`) ||
    uploadRoot.startsWith(`${root}${path.sep}`)
  ) {
    throw new Error("Restore targets overlap each other or the source backup.");
  }
  await targetMustNotExist(databasePath, "Restore database destination");
  await targetMustNotExist(uploadRoot, "Restore upload destination");

  await mkdir(allowedTargetRoot, { recursive: true });
  const stagingRoot = path.join(allowedTargetRoot, `.restore-${randomUUID()}`);
  const stagedDatabase = path.join(stagingRoot, databaseFilename);
  const stagedUploads = path.join(stagingRoot, "uploads");
  await mkdir(stagedUploads, { recursive: true });
  try {
    await copyFile(path.join(root, manifest.database.filename), stagedDatabase);
    for (const file of manifest.uploads.files) {
      const target = path.join(stagedUploads, ...file.storageKey.split("/"));
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(path.join(root, "uploads", ...file.storageKey.split("/")), target);
    }
    const stagedDatabaseBytes = await readFile(stagedDatabase);
    if (stagedDatabaseBytes.length !== manifest.database.bytes || sha256(stagedDatabaseBytes) !== manifest.database.sha256) {
      throw new Error("Staged restore database checksum or size validation failed.");
    }
    const stagedFiles = await listFiles(stagedUploads);
    if (
      manifest.uploads.files.map((file) => file.storageKey).sort().join("\n") !==
        stagedFiles.map((file) => file.storageKey).sort().join("\n")
    ) {
      throw new Error("Staged restore validation failed.");
    }
    await mkdir(path.dirname(databasePath), { recursive: true });
    await mkdir(path.dirname(uploadRoot), { recursive: true });
    await rename(stagedDatabase, databasePath);
    try {
      await rename(stagedUploads, uploadRoot);
    } catch (error) {
      await rm(databasePath, { force: true });
      throw error;
    }
    const restoredDatabaseValidation = await databaseValidation(databasePath);
    if (JSON.stringify(restoredDatabaseValidation.rowCounts) !== JSON.stringify(sourceDatabase.rowCounts)) {
      throw new Error("Restored protected table row counts do not match the verified source backup.");
    }
    return {
      integrityCheck: restoredDatabaseValidation.integrityCheck,
      foreignKeyViolations: restoredDatabaseValidation.foreignKeyViolations,
      mediaAssetCount: manifest.uploads.mediaAssetCount,
      uploadFileCount: stagedFiles.length,
      rowCounts: restoredDatabaseValidation.rowCounts,
      sourceRowCounts: sourceDatabase.rowCounts,
    };
  } finally {
    await rm(stagingRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}
