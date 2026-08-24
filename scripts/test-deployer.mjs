import { access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const candidates = process.platform === "win32"
  ? [
      process.env.NUAAFA_DEPLOY_TEST_BASH,
      process.env.ProgramFiles ? path.join(process.env.ProgramFiles, "Git", "bin", "bash.exe") : undefined,
      process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Programs", "Git", "bin", "bash.exe") : undefined,
      path.join(os.homedir(), ".cache", "codex-shell-runtimes", "Git-2.55.0.5-64-bit", "bin", "bash.exe"),
    ]
  : [process.env.NUAAFA_DEPLOY_TEST_BASH, "/usr/bin/bash", "/bin/bash"];

let bash;
for (const candidate of candidates) {
  if (!candidate) continue;
  try {
    await access(candidate);
    bash = candidate;
    break;
  } catch {
    // Try the next explicit Bash location.
  }
}

if (!bash) {
  throw new Error("A real Bash runtime is required for the isolated deployer test. Set NUAAFA_DEPLOY_TEST_BASH.");
}

async function runBash(args, label) {
  console.log(`[deployer-test] ${label}`);
  const code = await new Promise((resolve, reject) => {
    const child = spawn(bash, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (exitCode) => resolve(exitCode ?? 1));
  });
  if (code !== 0) throw new Error(`${label} exited ${code}.`);
}

await runBash(["-n", path.resolve("ops/deploy/nuaafa-deploy")], "canonical deployer bash -n");
await runBash(["-n", path.resolve("scripts/test-deployer.sh")], "isolated harness bash -n");
await runBash([path.resolve("scripts/test-deployer.sh")], "isolated A-V deployer matrix");
