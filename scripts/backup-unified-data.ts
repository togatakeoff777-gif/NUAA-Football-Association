import path from "node:path";

import { createCombinedBackup } from "../src/lib/combined-backup";

async function main() {
  const output = process.argv.find((arg) => arg.startsWith("--output="))?.slice("--output=".length);
  if (!output) throw new Error("Usage: npm run backup:unified -- --output=<empty-directory>");
  const databaseUrl = process.env.DATABASE_URL;
  const uploadRoot = process.env.NUAAFA_UPLOAD_DIR;
  if (!databaseUrl || !uploadRoot || !path.isAbsolute(uploadRoot)) throw new Error("DATABASE_URL and absolute NUAAFA_UPLOAD_DIR are required.");
  console.log(JSON.stringify(await createCombinedBackup({ databaseUrl, uploadRoot, outputDirectory: path.resolve(output) }), null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
