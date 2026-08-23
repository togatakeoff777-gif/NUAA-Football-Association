import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function main() {
  const databasePath = path.resolve("prisma/test-unified-admin-r1.db");
  const uploadRoot = path.join(os.tmpdir(), `nuaafa-unified-admin-r1-${process.pid}`);
  const targets = [databasePath, `${databasePath}-wal`, `${databasePath}-shm`, uploadRoot];
  for (const target of targets) await rm(target, { force: true, recursive: target === uploadRoot });

  const runner = path.resolve("node_modules/tsx/dist/cli.mjs");
  const worker = path.resolve("scripts/test-unified-admin-r1-worker.ts");
  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, [runner, worker], {
      env: {
        ...process.env,
        UNIFIED_ADMIN_R1_DATABASE_PATH: databasePath,
        NUAAFA_UPLOAD_DIR: uploadRoot,
      },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });

  for (const target of targets) await rm(target, { force: true, recursive: target === uploadRoot });
  if (exitCode !== 0) process.exit(exitCode);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unified Admin R1 test failed.");
  process.exit(1);
});
