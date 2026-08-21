import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import path from "node:path";

async function removeTestDatabase(databasePath: string) {
  for (const target of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
    await rm(target, { force: true });
  }
}

async function main() {
  const databasePath = path.resolve("prisma/test-referee-match-deletion.db");
  await removeTestDatabase(databasePath);
  const runner = path.resolve("node_modules/tsx/dist/cli.mjs");
  const worker = path.resolve("scripts/test-referee-match-deletion-worker.ts");
  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, [runner, worker], {
      env: { ...process.env, REFEREE_MATCH_DELETION_TEST_DATABASE_PATH: databasePath },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
  await removeTestDatabase(databasePath);
  if (exitCode !== 0) process.exit(exitCode);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Match deletion test failed.");
  process.exit(1);
});
