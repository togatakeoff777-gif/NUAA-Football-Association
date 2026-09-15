import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import path from "node:path";

async function removeDatabase(databasePath: string) {
  for (const target of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) await rm(target, { force: true, maxRetries: 10, retryDelay: 100 });
}

async function main() {
  const databasePath = path.resolve("prisma/test-admin-operations-r2-migration.db");
  const child = spawn(process.execPath, [path.resolve("node_modules/tsx/dist/cli.mjs"), path.resolve("scripts/test-admin-operations-r2-migration.ts")], { env: process.env, stdio: "inherit" });
  const exitCode = await new Promise<number>((resolve, reject) => { child.once("error", reject); child.once("exit", (code) => resolve(code ?? 1)); });
  await removeDatabase(databasePath);
  if (exitCode !== 0) process.exit(exitCode);
}

main().catch((error) => { console.error(error instanceof Error ? error.stack ?? error.message : "R2 migration runner failed."); process.exit(1); });
