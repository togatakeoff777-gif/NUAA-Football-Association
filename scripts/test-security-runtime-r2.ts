import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function main() {
  const root = await mkdtemp(path.join(os.tmpdir(), "nuaafa-security-r2-unit-"));
  try {
    for (const worker of ["test-security-runtime-r2-worker.ts", "test-security-runtime-r2-f010.ts"]) {
      const code = await new Promise<number>((resolve, reject) => {
        const child = spawn(process.execPath, ["--import", "tsx", path.resolve("scripts", worker)], {
          cwd: process.cwd(),
          env: {
            ...process.env,
            SECURITY_R2_TEST_DATABASE_PATH: path.join(root, "security-r2.db"),
          },
          stdio: "inherit",
        });
        child.once("error", reject);
        child.once("exit", (value) => resolve(value ?? 1));
      });
      if (code) {
        process.exitCode = code;
        return;
      }
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
