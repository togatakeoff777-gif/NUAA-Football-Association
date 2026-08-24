import path from "node:path";
import { assertMinimumFreeSpace } from "../src/lib/backup-operations";
import { readAndVerifyCombinedBackup, restoreCombinedBackup } from "../src/lib/combined-backup";

function argument(name: string) { return process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3); }

async function main() {
  if (process.env.NUAAFA_RESTORE_ISOLATED !== "1") throw new Error("Restore is locked. Set NUAAFA_RESTORE_ISOLATED=1 only for an isolated target.");
  const backupDirectory = argument("backup");
  const databasePath = argument("database");
  const uploadRoot = argument("uploads");
  const allowedTargetRoot = process.env.NUAAFA_RESTORE_TARGET_ROOT;
  if (!backupDirectory || !databasePath || !uploadRoot || !allowedTargetRoot || ![databasePath, uploadRoot, allowedTargetRoot].every(path.isAbsolute)) throw new Error("Absolute --backup, --database, --uploads and NUAAFA_RESTORE_TARGET_ROOT are required.");
  const verified = await readAndVerifyCombinedBackup(backupDirectory);
  const requiredBytes = Math.ceil((verified.manifest.database.bytes + verified.manifest.uploads.totalBytes) * 1.1) + 1024 * 1024;
  const diskPreflight = await assertMinimumFreeSpace(allowedTargetRoot, requiredBytes);
  console.log(JSON.stringify({
    diskPreflight,
    restore: await restoreCombinedBackup({ backupDirectory, databasePath, uploadRoot, allowedTargetRoot }),
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
