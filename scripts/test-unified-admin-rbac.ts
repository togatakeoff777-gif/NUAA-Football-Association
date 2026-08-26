import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function main() {
  const root = await mkdtemp(path.join(os.tmpdir(), "nuaafa-unified-rbac-"));
  const databasePath = path.join(root, "rbac.db");
  try {
    const code = await new Promise<number>((resolve, reject) => {
      const child = spawn(process.execPath, ["--import", "tsx", path.resolve("scripts/test-unified-admin-rbac-worker.ts")], {
        cwd: process.cwd(),
        env: { ...process.env, UNIFIED_ADMIN_RBAC_DATABASE_PATH: databasePath },
        stdio: "inherit",
      });
      child.once("error", reject);
      child.once("exit", (value) => resolve(value ?? 1));
    });
    if (code) process.exitCode = code;
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
