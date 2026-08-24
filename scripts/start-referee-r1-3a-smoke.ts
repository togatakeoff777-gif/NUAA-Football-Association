import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function main() {
  const smokeRoot = process.argv[2];
  const port = process.argv[3] ?? "3102";
  const requestedMode = process.argv[4];
  const mode = requestedMode === "dev" || requestedMode === "build" ? requestedMode : "start";
  if (!smokeRoot || !path.isAbsolute(smokeRoot)) {
    throw new Error("An absolute isolated smoke root is required.");
  }
  if (requestedMode === "cleanup") {
    const allowedPrefix = `${path.resolve(os.tmpdir(), "nuaafa-r1-3a-smoke-")}`;
    const resolvedRoot = path.resolve(smokeRoot);
    if (!resolvedRoot.startsWith(allowedPrefix)) {
      throw new Error("Smoke cleanup target is outside the dedicated system-temp prefix.");
    }
    await rm(resolvedRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    console.log(`Removed isolated smoke root: ${resolvedRoot}`);
    return;
  }

  const nextCli = path.resolve("node_modules/next/dist/bin/next");
  const child = spawn(
    process.execPath,
    mode === "build"
      ? [nextCli, "build"]
      : [nextCli, mode, "--hostname", "127.0.0.1", "-p", port],
    {
      env: {
        ...process.env,
        DATABASE_URL: `file:${path.join(smokeRoot, "smoke.db").replaceAll("\\", "/")}`,
        NUAAFA_UPLOAD_DIR: path.join(smokeRoot, "uploads"),
        NUAAFA_CONTENT_SOURCE: "database",
        REFEREE_ADMIN_SESSION_SECRET: randomBytes(32).toString("base64url"),
        REFEREE_MEMBER_SESSION_SECRET: randomBytes(32).toString("base64url"),
        APP_BASE_URL: `http://127.0.0.1:${port}`,
      },
      stdio: "inherit",
    },
  );

  child.once("exit", (code) => process.exit(code ?? 1));
  child.once("error", (error) => {
    console.error(error);
    process.exit(1);
  });

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => child.kill(signal));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "R1-3A smoke runner failed.");
  process.exit(1);
});
