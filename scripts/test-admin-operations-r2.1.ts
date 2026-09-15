import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import path from "node:path";

async function removeDatabase(databasePath: string) {
  for (const target of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
    await rm(target, { force: true, maxRetries: 10, retryDelay: 100 });
  }
}

async function main() {
  const databasePath = path.resolve("prisma/test-admin-operations-r2.1.db");
  const prismaDirectory = `${path.resolve("prisma")}${path.sep}`;
  if (!databasePath.startsWith(prismaDirectory)) throw new Error("R2.1 test database escaped prisma directory.");
  await removeDatabase(databasePath);
  const child = spawn(process.execPath, [path.resolve("node_modules/tsx/dist/cli.mjs"), path.resolve("scripts/test-admin-operations-r2.1-worker.ts")], {
    env: { ...process.env, ADMIN_OPERATIONS_R21_TEST_DATABASE_PATH: databasePath },
    stdio: "inherit",
  });
  const exitCode = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
  await removeDatabase(databasePath);
  if (exitCode !== 0) process.exit(exitCode);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : "Admin Operations R2.1 test failed.");
  process.exit(1);
});
