import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

type Fixture = {
  databasePath: string;
  uploadRoot: string;
  password: string;
  matchId: string;
  refereeId: string;
};

function runCapture(args: string[], environment: NodeJS.ProcessEnv) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: process.cwd(), env: environment, stdio: ["ignore", "pipe", "inherit"] });
    let output = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve(output) : reject(new Error(`Fixture command exited with ${code ?? "unknown"}.`)));
  });
}

function runInherited(script: string, environment: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", path.resolve(script)], {
      cwd: process.cwd(),
      env: environment,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`${script} exited with ${code ?? "unknown"}.`)));
  });
}

function findPort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return server.close(() => reject(new Error("Failed to allocate a test port.")));
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

function startServer(port: number, environment: NodeJS.ProcessEnv) {
  const server = spawn(
    process.execPath,
    [path.resolve("node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(port)],
    { cwd: process.cwd(), env: environment, stdio: ["ignore", "pipe", "pipe"] },
  );
  server.stdout?.pipe(process.stdout);
  server.stderr?.pipe(process.stderr);
  return server;
}

async function waitForServer(origin: string, server: ChildProcess, expectedHealth: 200 | 503) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next server exited before readiness (${server.exitCode}).`);
    try {
      const response = await fetch(`${origin}/api/health`, { cache: "no-store" });
      if (response.status === expectedHealth) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the isolated security server.");
}

async function stopServer(server: ChildProcess | null) {
  if (!server || server.exitCode !== null) return;
  server.kill();
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 5_000);
    server.once("exit", () => { clearTimeout(timeout); resolve(); });
  });
}

async function main() {
  const root = await mkdtemp(path.join(os.tmpdir(), "nuaafa-security-r1-http-"));
  const databasePath = path.join(root, "security.db");
  const uploadRoot = path.join(root, "uploads");
  let server: ChildProcess | null = null;
  try {
    const fixtureOutput = await runCapture(
      ["--import", "tsx", path.resolve("scripts/prepare-unified-admin-smoke.ts")],
      {
        ...process.env,
        DATABASE_URL: `file:${databasePath.replaceAll("\\", "/")}`,
        UNIFIED_ADMIN_SMOKE_DATABASE_PATH: databasePath,
        NUAAFA_UPLOAD_DIR: uploadRoot,
      },
    );
    const fixture = JSON.parse(fixtureOutput.trim().split(/\r?\n/u).at(-1) ?? "") as Fixture;
    const mainPort = await findPort();
    const mainOrigin = `http://127.0.0.1:${mainPort}`;
    const mainEnvironment: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: "production",
      DATABASE_URL: `file:${databasePath.replaceAll("\\", "/")}`,
      NUAAFA_UPLOAD_DIR: uploadRoot,
      NUAAFA_CONTENT_SOURCE: "database",
      REFEREE_ADMIN_SESSION_SECRET: "security-r1-admin-session-secret-2026",
      REFEREE_MEMBER_SESSION_SECRET: "security-r1-member-session-secret-2026",
      SECURITY_HTTP_BASE_URL: mainOrigin,
      SECURITY_HTTP_DATABASE_PATH: fixture.databasePath,
      SECURITY_HTTP_PASSWORD: fixture.password,
      SECURITY_HTTP_MATCH_ID: fixture.matchId,
      SECURITY_HTTP_REFEREE_ID: fixture.refereeId,
    };
    server = startServer(mainPort, mainEnvironment);
    await waitForServer(mainOrigin, server, 200);
    await runInherited("scripts/test-security-http-worker.ts", mainEnvironment);
    await stopServer(server);
    server = null;

    const blockedParent = path.join(root, "not-a-directory");
    await writeFile(blockedParent, "fault fixture");
    const faultPort = await findPort();
    const faultOrigin = `http://127.0.0.1:${faultPort}`;
    const faultEnvironment: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: "production",
      DATABASE_URL: `file:${path.join(blockedParent, "fault.db").replaceAll("\\", "/")}`,
      NUAAFA_UPLOAD_DIR: uploadRoot,
      REFEREE_ADMIN_SESSION_SECRET: "security-r1-admin-session-secret-2026",
      REFEREE_MEMBER_SESSION_SECRET: "security-r1-member-session-secret-2026",
      SECURITY_HTTP_BASE_URL: faultOrigin,
    };
    server = startServer(faultPort, faultEnvironment);
    await waitForServer(faultOrigin, server, 503);
    await runInherited("scripts/test-security-http-fault-worker.ts", faultEnvironment);
  } finally {
    await stopServer(server);
    await rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
