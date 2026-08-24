import path from "node:path";

import { assertMinimumFreeSpace, calculateBackupCapacity, generatedBackupDirectory } from "../src/lib/backup-operations";
import {
  combinedBackupProfiles,
  createCombinedBackup,
  sqlitePathFromUrl,
} from "../src/lib/combined-backup";

function argument(name: string) {
  return process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
}

async function main() {
  const outputArgument = argument("output");
  const rootArgument = argument("root") ?? process.env.NUAAFA_BACKUP_ROOT;
  const profileArgument = argument("profile");
  if (Boolean(outputArgument) === Boolean(rootArgument)) {
    throw new Error("Use exactly one of --output=<empty-directory> or --root=<formal-backup-root>.");
  }
  const databaseUrl = process.env.DATABASE_URL;
  const uploadRoot = process.env.NUAAFA_UPLOAD_DIR;
  if (!databaseUrl || !uploadRoot || !path.isAbsolute(uploadRoot)) throw new Error("DATABASE_URL and absolute NUAAFA_UPLOAD_DIR are required.");
  if (profileArgument && profileArgument !== "legacy-pre-enablement") {
    throw new Error("--profile only accepts legacy-pre-enablement; omit it for the normal modern backup path.");
  }
  const profile = profileArgument === "legacy-pre-enablement"
    ? combinedBackupProfiles.legacyPreEnablement
    : combinedBackupProfiles.modern;
  const databasePath = sqlitePathFromUrl(databaseUrl);
  const capacity = await calculateBackupCapacity({
    databasePath,
    ...(profile === combinedBackupProfiles.legacyPreEnablement ? { uploadBytes: 0 } : { uploadRoot }),
    retentionCount: 1,
  });
  const output = outputArgument ? path.resolve(outputArgument) : generatedBackupDirectory(path.resolve(rootArgument!));
  const disk = await assertMinimumFreeSpace(path.dirname(output), capacity.backupStagingOverhead);
  const manifest = await createCombinedBackup({ databaseUrl, uploadRoot, outputDirectory: output, profile });
  console.log(JSON.stringify({ outputDirectory: output, diskPreflight: disk, manifest }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
