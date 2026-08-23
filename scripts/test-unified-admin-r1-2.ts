import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function main() {
  const root = await mkdtemp(path.join(os.tmpdir(), "nuaafa-r1-2-"));
  const databasePath = path.join(root, "r1-2.db");
  const uploadRoot = path.join(root, "uploads");
  const worker = path.resolve("scripts/test-unified-admin-r1-2-worker.ts");
  try {
    const code = await new Promise<number>((resolve, reject) => {
      const child = spawn(process.execPath, ["--import", "tsx", worker], {
        cwd: process.cwd(),
        env: { ...process.env, R1_2_TEST_ROOT: root, R1_2_TEST_DATABASE_PATH: databasePath, NUAAFA_UPLOAD_DIR: uploadRoot },
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

main().catch((error) => { console.error(error); process.exitCode = 1; });
