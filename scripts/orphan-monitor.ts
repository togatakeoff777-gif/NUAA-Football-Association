import path from "node:path";

import { scanMediaStorage } from "../src/lib/media-orphan-monitor";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const uploadRoot = process.env.NUAAFA_UPLOAD_DIR;
  const staleAgeMs = Number(process.env.NUAAFA_STALE_STAGING_AGE_MS ?? 60 * 60 * 1_000);
  if (!databaseUrl || !uploadRoot || !path.isAbsolute(uploadRoot)) {
    throw new Error("DATABASE_URL and absolute NUAAFA_UPLOAD_DIR are required.");
  }
  const report = await scanMediaStorage({ databaseUrl, uploadRoot, staleStagingAgeMs: staleAgeMs });
  console.log(JSON.stringify(report, null, 2));
  if (report.anomalyCount) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Orphan scanner failed.");
  process.exitCode = 3;
});
