import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function main() {
  const root = await mkdtemp(path.join(os.tmpdir(), "nuaafa-r1-3b-"));
  const databasePath = path.join(root, "competition-import.db");
  try {
    const worker = path.resolve("scripts/test-competition-import-worker.ts");
    const code = await new Promise<number>((resolve, reject) => {
      const child = spawn(process.execPath, ["--import", "tsx", worker], {
        cwd: process.cwd(),
        env: { ...process.env, COMPETITION_IMPORT_TEST_DATABASE_PATH: databasePath },
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
  console.error(error);
  process.exitCode = 1;
});
