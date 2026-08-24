import path from "node:path";

import { calculateBackupCapacity, diskSpace } from "../src/lib/backup-operations";
import { sqlitePathFromUrl } from "../src/lib/combined-backup";

function numberEnvironment(name: string, fallback: number) {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be numeric.`);
  return parsed;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const uploadRoot = process.env.NUAAFA_UPLOAD_DIR;
  const backupRoot = process.env.NUAAFA_BACKUP_ROOT;
  if (!databaseUrl || !uploadRoot || !backupRoot || !path.isAbsolute(uploadRoot) || !path.isAbsolute(backupRoot)) {
    throw new Error("DATABASE_URL, absolute NUAAFA_UPLOAD_DIR, and absolute NUAAFA_BACKUP_ROOT are required.");
  }
  const retentionCount = numberEnvironment("NUAAFA_BACKUP_RETENTION_COUNT", 14);
  const warningPercent = numberEnvironment("NUAAFA_DISK_WARNING_PERCENT", 20);
  const criticalPercent = numberEnvironment("NUAAFA_DISK_CRITICAL_PERCENT", 10);
  const capacity = await calculateBackupCapacity({
    databasePath: sqlitePathFromUrl(databaseUrl),
    uploadRoot,
    retentionCount,
    thresholds: { warningPercent, criticalPercent },
  });
  const targets = await Promise.all([uploadRoot, backupRoot].map(diskSpace));
  const uniqueFilesystems = [...new Map(targets.map((target) => [target.filesystemKey, target])).values()];
  const levels = uniqueFilesystems.map((filesystem) => ({
    ...filesystem,
    level: filesystem.freePercent <= criticalPercent
      ? "CRITICAL"
      : filesystem.freePercent <= warningPercent
        ? "WARNING"
        : "OK",
  }));
  console.log(JSON.stringify({ capacity, filesystems: levels }, null, 2));
  if (levels.some((level) => level.level === "CRITICAL")) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Capacity planning failed.");
  process.exitCode = 3;
});
