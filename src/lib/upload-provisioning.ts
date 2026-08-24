import { execFile } from "node:child_process";
import { constants } from "node:fs";
import { access, lstat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { assertMinimumFreeSpace } from "@/lib/backup-operations";

const execFileAsync = promisify(execFile);

function octalMode(mode: number) {
  return (mode & 0o777).toString(8).padStart(4, "0");
}

async function optionalLstat(target: string) {
  try {
    return await lstat(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export function validateUploadPathBoundary(root: string, candidateStorageKey: string) {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, ...candidateStorageKey.split("/"));
  const relative = path.relative(resolvedRoot, target);
  return Boolean(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
}

export async function verifyUploadProvisioning(input: {
  configuredPath: string;
  expectedPath: string;
  expectedOwner: string;
  expectedGroup: string;
  expectedMode: "0700";
  minimumFreeBytes: number;
}) {
  if (!path.isAbsolute(input.configuredPath) || !path.isAbsolute(input.expectedPath)) {
    throw new Error("Configured and expected upload paths must be absolute.");
  }
  const configuredPath = path.resolve(input.configuredPath);
  const expectedPath = path.resolve(input.expectedPath);
  if (configuredPath !== expectedPath) {
    throw new Error(`NUAAFA_UPLOAD_DIR resolves to ${configuredPath}, expected ${expectedPath}.`);
  }
  const rootInfo = await lstat(configuredPath);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error("Upload path must be a real directory.");
  await access(configuredPath, constants.R_OK | constants.W_OK);
  const stagingPath = path.join(configuredPath, ".staging");
  const stagingInfo = await optionalLstat(stagingPath);
  if (stagingInfo && (!stagingInfo.isDirectory() || stagingInfo.isSymbolicLink())) {
    throw new Error("Existing .staging path must be a real directory.");
  }
  if (!validateUploadPathBoundary(configuredPath, "2026/08/00000000-0000-0000-0000-000000000000.pdf")) {
    throw new Error("Normal storage key did not remain inside upload root.");
  }
  if (validateUploadPathBoundary(configuredPath, "../../escape.pdf")) {
    throw new Error("Path traversal boundary check failed.");
  }
  const disk = await assertMinimumFreeSpace(configuredPath, input.minimumFreeBytes);
  let ownership: {
    platform: "linux" | "non-linux";
    owner: string;
    group: string;
    mode: string;
    enforced: boolean;
  };
  if (process.platform === "linux") {
    const [expectedUidResult, expectedGidResult] = await Promise.all([
      execFileAsync("id", ["-u", input.expectedOwner]),
      execFileAsync("id", ["-g", input.expectedGroup]),
    ]);
    const expectedUid = Number(expectedUidResult.stdout.trim());
    const expectedGid = Number(expectedGidResult.stdout.trim());
    const actualMode = octalMode(rootInfo.mode);
    if (rootInfo.uid !== expectedUid || rootInfo.gid !== expectedGid || actualMode !== input.expectedMode) {
      throw new Error(
        `Upload ownership/mode mismatch: uid=${rootInfo.uid}, gid=${rootInfo.gid}, mode=${actualMode}.`,
      );
    }
    ownership = {
      platform: "linux",
      owner: input.expectedOwner,
      group: input.expectedGroup,
      mode: actualMode,
      enforced: true,
    };
  } else {
    ownership = {
      platform: "non-linux",
      owner: input.expectedOwner,
      group: input.expectedGroup,
      mode: input.expectedMode,
      enforced: false,
    };
  }
  return {
    configuredPath,
    isDirectory: true,
    applicationUserReadWrite: true,
    unexpectedOtherAccessAbsent: process.platform === "linux" ? octalMode(rootInfo.mode) === "0700" : null,
    staging: { path: stagingPath, existingDirectory: Boolean(stagingInfo), creatableFromWritableRoot: true },
    pathTraversalRejected: true,
    disk,
    ownership,
  };
}
