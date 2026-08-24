import path from "node:path";

import { applyBackupRetention } from "../src/lib/backup-operations";

function argument(name: string) {
  return process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
}

async function main() {
  const root = argument("root") ?? process.env.NUAAFA_BACKUP_ROOT;
  const keep = Number(argument("keep") ?? process.env.NUAAFA_BACKUP_RETENTION_COUNT);
  const apply = process.argv.includes("--apply");
  if (!root || !path.isAbsolute(root) || !Number.isSafeInteger(keep) || keep < 0) {
    throw new Error("Absolute --root and non-negative integer --keep are required.");
  }
  if (apply && process.env.NUAAFA_RETENTION_APPLY !== "1") {
    throw new Error("Retention apply is locked. Set NUAAFA_RETENTION_APPLY=1 only for an explicitly approved cleanup.");
  }
  const result = await applyBackupRetention({ backupRoot: root, keepCount: keep, confirmApply: apply });
  console.log(JSON.stringify(result, null, 2));
  if (result.anomalies.length) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Backup retention failed.");
  process.exitCode = 3;
});
