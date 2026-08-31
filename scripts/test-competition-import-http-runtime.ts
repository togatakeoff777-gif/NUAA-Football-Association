import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

function runCapture(command: string, args: string[], environment: NodeJS.ProcessEnv) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, { cwd: process.cwd(), env: environment, stdio: ["ignore", "pipe", "inherit"] });
    let output = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve(output) : reject(new Error(`${command} exited with ${code ?? "unknown"}.`)));
  });
}

function runInherited(command: string, args: string[], environment: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd: process.cwd(), env: environment, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code ?? "unknown"}.`)));
  });
}

async function findPort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return server.close(() => reject(new Error("Failed to allocate an isolated port.")));
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

async function waitForHealth(origin: string, server: ChildProcess) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next server exited before health was ready (${server.exitCode}).`);
    try {
      const response = await fetch(`${origin}/api/health`, { cache: "no-store" });
      if (response.status === 200) return;
    } catch {
      // The isolated production server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for the isolated production server.");
}

async function stopServer(server: ChildProcess) {
  if (server.exitCode !== null) return;
  server.kill();
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 5_000);
    server.once("exit", () => { clearTimeout(timer); resolve(); });
  });
}

async function main() {
  const root = await mkdtemp(path.join(os.tmpdir(), "nuaafa-competition-import-http-"));
  const databasePath = path.join(root, "smoke.db");
  const uploadRoot = path.join(root, "uploads");
  const port = await findPort();
  const origin = `http://127.0.0.1:${port}`;
  let server: ChildProcess | null = null;
  try {
    await runCapture(process.execPath, ["--import", "tsx", path.resolve("scripts/prepare-unified-admin-smoke.ts")], {
      ...process.env,
      DATABASE_URL: `file:${databasePath.replaceAll("\\", "/")}`,
      UNIFIED_ADMIN_SMOKE_DATABASE_PATH: databasePath,
      NUAAFA_UPLOAD_DIR: uploadRoot,
    });
    const environment: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: "production",
      DATABASE_URL: `file:${databasePath.replaceAll("\\", "/")}`,
      NUAAFA_UPLOAD_DIR: uploadRoot,
      NUAAFA_CONTENT_SOURCE: "database",
      REFEREE_ADMIN_SESSION_SECRET: "competition-import-http-admin-session-secret",
      REFEREE_MEMBER_SESSION_SECRET: "competition-import-http-member-session-secret",
    };
    server = spawn(process.execPath, [path.resolve("node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(port)], {
      cwd: process.cwd(),
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    });
    server.stdout?.pipe(process.stdout);
    server.stderr?.pipe(process.stderr);
    await waitForHealth(origin, server);
    await runInherited(process.execPath, ["--import", "tsx", path.resolve("scripts/test-competition-import-http.ts"), root, origin], environment);
  } finally {
    if (server) await stopServer(server);
    await rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
