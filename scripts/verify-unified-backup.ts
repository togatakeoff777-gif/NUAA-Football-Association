import path from "node:path";

import { readAndVerifyCombinedBackup } from "../src/lib/combined-backup";

async function main() {
  const backup = process.argv.find((arg) => arg.startsWith("--backup="))?.slice("--backup=".length);
  if (!backup || !path.isAbsolute(backup)) throw new Error("Usage: npm run backup:verify -- --backup=<absolute-backup-directory>");
  const result = await readAndVerifyCombinedBackup(backup);
  console.log(JSON.stringify({
    valid: true,
    backupId: result.manifest.backupId,
    backupProfile: result.manifest.backupProfile,
    generatedAtUtc: result.manifest.generatedAtUtc,
    schemaCapabilities: result.manifest.schemaCapabilities,
    completion: result.completion,
    database: result.database,
    uploads: result.manifest.uploads,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Backup verification failed.");
  process.exitCode = 1;
});
