import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

async function main() {
  const root = await mkdtemp(path.join(tmpdir(), "nuaafa-r1-migration-"));
  const databasePath = path.join(root, "migration-clone.db");
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        process.execPath,
        ["--import", "tsx", "scripts/test-unified-admin-migration-worker.ts"],
        {
          cwd: process.cwd(),
          stdio: "inherit",
          env: { ...process.env, UNIFIED_ADMIN_MIGRATION_DATABASE_PATH: databasePath },
        },
      );
      child.on("error", reject);
      child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Migration worker exited with ${code}.`)));
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
