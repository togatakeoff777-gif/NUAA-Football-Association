import { randomUUID } from "node:crypto";
import { lstat, readdir, rm, stat, statfs } from "node:fs/promises";
import path from "node:path";

import { readAndVerifyCombinedBackup } from "@/lib/combined-backup";

export type CapacityThresholds = {
  warningPercent: number;
  criticalPercent: number;
};

export type RetentionAnomaly = {
  entry: string;
  classification: "UNKNOWN_ENTRY" | "SYMLINK" | "INCOMPLETE_OR_INVALID_BACKUP";
  detail: string;
};

function validatePercentage(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0 || value >= 100) {
    throw new Error(`${label} must be greater than 0 and less than 100.`);
  }
  return value;
}

function validateNonNegativeInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer.`);
  return value;
}

async function directorySize(root: string, current = root): Promise<number> {
  const entries = await readdir(current, { withFileTypes: true });
  let total = 0;
  for (const entry of entries) {
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not supported in capacity inputs: ${entry.name}`);
    const target = path.join(current, entry.name);
    if (entry.isDirectory()) total += await directorySize(root, target);
    else if (entry.isFile()) total += (await stat(target)).size;
    else throw new Error(`Unexpected filesystem entry in capacity inputs: ${entry.name}`);
  }
  return total;
}

async function existingAncestor(target: string) {
  let current = path.resolve(target);
  for (;;) {
    try {
      await stat(current);
      return current;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const parent = path.dirname(current);
      if (parent === current) throw new Error(`No existing ancestor found for ${target}.`);
      current = parent;
    }
  }
}

export async function diskSpace(target: string) {
  const ancestor = await existingAncestor(target);
  const filesystem = await statfs(ancestor);
  const freeBytes = filesystem.bavail * filesystem.bsize;
  const totalBytes = filesystem.blocks * filesystem.bsize;
  return {
    target: path.resolve(target),
    checkedAt: ancestor,
    filesystemKey: process.platform === "win32" ? path.parse(ancestor).root.toLowerCase() : String((await stat(ancestor)).dev),
    freeBytes,
    totalBytes,
    freePercent: totalBytes ? (freeBytes / totalBytes) * 100 : 0,
  };
}

export async function assertMinimumFreeSpace(target: string, requiredBytes: number) {
  validateNonNegativeInteger(requiredBytes, "Required free bytes");
  const result = await diskSpace(target);
  if (result.freeBytes < requiredBytes) {
    throw new Error(`Insufficient free space: ${result.freeBytes} bytes available, ${requiredBytes} bytes required.`);
  }
  return result;
}

export async function calculateBackupCapacity(input: {
  databasePath?: string;
  uploadRoot?: string;
  databaseBytes?: number;
  uploadBytes?: number;
  retentionCount: number;
  backupOverheadRatio?: number;
  restoreOverheadRatio?: number;
  stagingOverheadRatio?: number;
  safetyReserveRatio?: number;
  thresholds?: CapacityThresholds;
}) {
  const retentionCount = validateNonNegativeInteger(input.retentionCount, "Retention count");
  const databaseBytes = input.databaseBytes ?? (input.databasePath ? (await stat(input.databasePath)).size : undefined);
  const uploadBytes = input.uploadBytes ?? (input.uploadRoot ? await directorySize(input.uploadRoot) : undefined);
  if (databaseBytes === undefined || uploadBytes === undefined) {
    throw new Error("Database and upload sizes must be supplied as paths or byte values.");
  }
  validateNonNegativeInteger(databaseBytes, "Database bytes");
  validateNonNegativeInteger(uploadBytes, "Upload bytes");
  const backupOverheadRatio = input.backupOverheadRatio ?? 1.05;
  const restoreOverheadRatio = input.restoreOverheadRatio ?? 1.1;
  const stagingOverheadRatio = input.stagingOverheadRatio ?? 1.1;
  const safetyReserveRatio = input.safetyReserveRatio ?? 0.2;
  for (const [label, value] of Object.entries({ backupOverheadRatio, restoreOverheadRatio, stagingOverheadRatio, safetyReserveRatio })) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a non-negative number.`);
  }
  const thresholds = input.thresholds ?? { warningPercent: 20, criticalPercent: 10 };
  validatePercentage(thresholds.warningPercent, "Warning percentage");
  validatePercentage(thresholds.criticalPercent, "Critical percentage");
  if (thresholds.criticalPercent >= thresholds.warningPercent) {
    throw new Error("Critical disk percentage must be lower than warning disk percentage.");
  }
  const currentDatasetEstimate = databaseBytes + uploadBytes;
  const perBackupEstimate = Math.ceil(currentDatasetEstimate * backupOverheadRatio) + 1024 * 1024;
  const retentionEstimate = perBackupEstimate * retentionCount;
  const backupStagingOverhead = Math.ceil(perBackupEstimate * stagingOverheadRatio);
  const restoreWorkspaceOverhead = Math.ceil(currentDatasetEstimate * restoreOverheadRatio);
  const temporaryPeak = backupStagingOverhead + restoreWorkspaceOverhead;
  const safetyReserve = Math.ceil((retentionEstimate + temporaryPeak) * safetyReserveRatio);
  const recommendedMinimumFreeSpace = retentionEstimate + temporaryPeak + safetyReserve;
  return {
    inputs: { databaseBytes, uploadBytes, retentionCount },
    currentDatasetEstimate,
    perBackupEstimate,
    retentionEstimate,
    backupStagingOverhead,
    restoreWorkspaceOverhead,
    temporaryPeak,
    safetyReserve,
    recommendedMinimumFreeSpace,
    thresholds,
  };
}

export function generatedBackupDirectory(backupRoot: string, now = new Date()) {
  const root = path.resolve(backupRoot);
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return path.join(root, `nuaafa-backup-${stamp}-${randomUUID().replaceAll("-", "").slice(0, 8)}`);
}

export async function planBackupRetention(input: { backupRoot: string; keepCount: number }) {
  const root = path.resolve(input.backupRoot);
  const keepCount = validateNonNegativeInteger(input.keepCount, "Retention keep count");
  const rootInfo = await lstat(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error("Backup root must be a real directory.");
  const entries = await readdir(root, { withFileTypes: true });
  const valid: Array<{ entry: string; path: string; generatedAtUtc: string; backupId: string }> = [];
  const anomalies: RetentionAnomaly[] = [];
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isSymbolicLink()) {
      anomalies.push({ entry: entry.name, classification: "SYMLINK", detail: "Symlink was not followed." });
      continue;
    }
    if (!entry.isDirectory()) {
      anomalies.push({ entry: entry.name, classification: "UNKNOWN_ENTRY", detail: "Unrelated file was not touched." });
      continue;
    }
    try {
      const verified = await readAndVerifyCombinedBackup(target, { validateDatabase: false });
      valid.push({
        entry: entry.name,
        path: target,
        generatedAtUtc: verified.manifest.generatedAtUtc,
        backupId: verified.manifest.backupId,
      });
    } catch (error) {
      anomalies.push({
        entry: entry.name,
        classification: "INCOMPLETE_OR_INVALID_BACKUP",
        detail: error instanceof Error ? error.message : "Backup validation failed.",
      });
    }
  }
  valid.sort((left, right) => right.generatedAtUtc.localeCompare(left.generatedAtUtc));
  return {
    backupRoot: root,
    keepCount,
    keep: valid.slice(0, keepCount),
    deleteCandidates: valid.slice(keepCount),
    anomalies,
    dryRun: true,
  };
}

export async function applyBackupRetention(input: { backupRoot: string; keepCount: number; confirmApply: boolean }) {
  const plan = await planBackupRetention(input);
  if (!input.confirmApply) return plan;
  if (plan.anomalies.length) {
    throw new Error("Retention apply refused because unknown, symlink, incomplete, or invalid entries exist.");
  }
  for (const candidate of plan.deleteCandidates) {
    const relative = path.relative(plan.backupRoot, candidate.path);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("Retention candidate escaped the formal backup root.");
    }
    const info = await lstat(candidate.path);
    if (!info.isDirectory() || info.isSymbolicLink()) {
      throw new Error("Retention candidate changed after validation.");
    }
    await rm(candidate.path, { recursive: true, force: false, maxRetries: 3, retryDelay: 100 });
  }
  return { ...plan, dryRun: false, deleted: plan.deleteCandidates.map((candidate) => candidate.entry) };
}
