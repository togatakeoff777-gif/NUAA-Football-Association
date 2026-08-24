import { lstat, readdir } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";

const storageKeyPattern = /^[0-9]{4}\/[0-9]{2}\/[0-9a-f-]+\.(?:jpg|jpeg|png|webp|pdf)$/;

export type MediaStorageAnomaly = {
  classification:
    | "DB_RECORD_MISSING_FILE"
    | "DB_RECORD_FILE_SIZE_MISMATCH"
    | "FILE_WITHOUT_DB_RECORD"
    | "STALE_STAGING_FILE"
    | "INVALID_STORAGE_PATH";
  severity: "WARNING" | "HIGH" | "CRITICAL";
  pathOrStorageKey: string;
  recommendedAction: string;
  detail: string;
};

export type MediaStorageReport = {
  scannedAtUtc: string;
  databaseRecordCount: number;
  physicalFileCount: number;
  anomalyCount: number;
  counts: Record<MediaStorageAnomaly["classification"], number>;
  anomalies: MediaStorageAnomaly[];
};

type PhysicalEntry = { storageKey: string; bytes: number };

async function scanDirectory(
  root: string,
  current: string,
  anomalies: MediaStorageAnomaly[],
  nowMs: number,
  staleStagingAgeMs: number,
): Promise<PhysicalEntry[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const files: PhysicalEntry[] = [];
  for (const entry of entries) {
    const target = path.join(current, entry.name);
    const relative = path.relative(root, target).split(path.sep).join("/");
    if (entry.isSymbolicLink()) {
      anomalies.push({
        classification: "INVALID_STORAGE_PATH",
        severity: "CRITICAL",
        pathOrStorageKey: relative,
        recommendedAction: "Investigate manually; do not follow or delete automatically.",
        detail: "Symbolic links are not permitted in media storage.",
      });
      continue;
    }
    if (relative === ".staging" && entry.isDirectory()) {
      const stagingEntries = await readdir(target, { withFileTypes: true });
      for (const stagingEntry of stagingEntries) {
        const stagingTarget = path.join(target, stagingEntry.name);
        const stagingRelative = `.staging/${stagingEntry.name}`;
        if (stagingEntry.isSymbolicLink() || !stagingEntry.isFile() || !stagingEntry.name.endsWith(".upload")) {
          anomalies.push({
            classification: "INVALID_STORAGE_PATH",
            severity: "CRITICAL",
            pathOrStorageKey: stagingRelative,
            recommendedAction: "Inspect the unexpected staging entry manually; do not delete automatically.",
            detail: "Unexpected entry exists in the staging directory.",
          });
          continue;
        }
        const info = await lstat(stagingTarget);
        if (nowMs - info.mtimeMs >= staleStagingAgeMs) {
          anomalies.push({
            classification: "STALE_STAGING_FILE",
            severity: "WARNING",
            pathOrStorageKey: stagingRelative,
            recommendedAction: "Confirm no upload is active, then use a separate explicitly authorized cleanup operation.",
            detail: `Staging file age is at least ${staleStagingAgeMs} ms.`,
          });
        }
      }
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...await scanDirectory(root, target, anomalies, nowMs, staleStagingAgeMs));
      continue;
    }
    if (!entry.isFile() || !storageKeyPattern.test(relative)) {
      anomalies.push({
        classification: "INVALID_STORAGE_PATH",
        severity: "CRITICAL",
        pathOrStorageKey: relative,
        recommendedAction: "Investigate the unexpected storage entry manually; do not delete automatically.",
        detail: "Physical entry does not satisfy the frozen media storage-key contract.",
      });
      continue;
    }
    files.push({ storageKey: relative, bytes: (await lstat(target)).size });
  }
  return files;
}

export async function scanMediaStorage(input: {
  databaseUrl: string;
  uploadRoot: string;
  now?: Date;
  staleStagingAgeMs?: number;
}): Promise<MediaStorageReport> {
  if (!input.databaseUrl.startsWith("file:")) throw new Error("DATABASE_URL must be an explicit file: SQLite URL.");
  if (!path.isAbsolute(input.uploadRoot)) throw new Error("NUAAFA_UPLOAD_DIR must be an absolute path.");
  const root = path.resolve(input.uploadRoot);
  const rootInfo = await lstat(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error("Upload root must be a real directory.");
  const staleStagingAgeMs = input.staleStagingAgeMs ?? 60 * 60 * 1_000;
  if (!Number.isSafeInteger(staleStagingAgeMs) || staleStagingAgeMs < 1) {
    throw new Error("Stale staging age must be a positive integer.");
  }
  const anomalies: MediaStorageAnomaly[] = [];
  const files = await scanDirectory(root, root, anomalies, (input.now ?? new Date()).getTime(), staleStagingAgeMs);
  const client = createClient({ url: input.databaseUrl });
  let rows: Array<{ storageKey: string; size: number }>;
  try {
    const result = await client.execute('SELECT "storageKey", "size" FROM "MediaAsset" ORDER BY "storageKey"');
    rows = result.rows.map((row) => ({ storageKey: String(row.storageKey), size: Number(row.size) }));
  } finally {
    client.close();
  }
  const physicalByKey = new Map(files.map((file) => [file.storageKey, file]));
  const databaseKeys = new Set<string>();
  for (const row of rows) {
    databaseKeys.add(row.storageKey);
    if (!storageKeyPattern.test(row.storageKey)) {
      anomalies.push({
        classification: "INVALID_STORAGE_PATH",
        severity: "CRITICAL",
        pathOrStorageKey: row.storageKey,
        recommendedAction: "Correct the invalid database storage key through a separately approved data-repair procedure.",
        detail: "MediaAsset storageKey does not satisfy the frozen storage contract.",
      });
      continue;
    }
    const physical = physicalByKey.get(row.storageKey);
    if (!physical) {
      anomalies.push({
        classification: "DB_RECORD_MISSING_FILE",
        severity: "CRITICAL",
        pathOrStorageKey: row.storageKey,
        recommendedAction: "Restore the file from a verified combined backup or escalate for manual reconciliation.",
        detail: "MediaAsset exists but its physical file is missing.",
      });
    } else if (physical.bytes !== row.size) {
      anomalies.push({
        classification: "DB_RECORD_FILE_SIZE_MISMATCH",
        severity: "HIGH",
        pathOrStorageKey: row.storageKey,
        recommendedAction: "Verify checksum and restore the correct file from a combined backup.",
        detail: `Database size ${row.size} does not equal physical size ${physical.bytes}.`,
      });
    }
  }
  for (const file of files) {
    if (!databaseKeys.has(file.storageKey)) {
      anomalies.push({
        classification: "FILE_WITHOUT_DB_RECORD",
        severity: "HIGH",
        pathOrStorageKey: file.storageKey,
        recommendedAction: "Reconcile provenance manually; do not delete automatically.",
        detail: "Physical stored file exists without a MediaAsset record.",
      });
    }
  }
  anomalies.sort((left, right) => left.classification.localeCompare(right.classification) || left.pathOrStorageKey.localeCompare(right.pathOrStorageKey));
  const counts: MediaStorageReport["counts"] = {
    DB_RECORD_MISSING_FILE: 0,
    DB_RECORD_FILE_SIZE_MISMATCH: 0,
    FILE_WITHOUT_DB_RECORD: 0,
    STALE_STAGING_FILE: 0,
    INVALID_STORAGE_PATH: 0,
  };
  for (const anomaly of anomalies) counts[anomaly.classification] += 1;
  return {
    scannedAtUtc: (input.now ?? new Date()).toISOString(),
    databaseRecordCount: rows.length,
    physicalFileCount: files.length,
    anomalyCount: anomalies.length,
    counts,
    anomalies,
  };
}
