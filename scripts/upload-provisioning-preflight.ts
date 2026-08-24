import { verifyUploadProvisioning } from "../src/lib/upload-provisioning";

async function main() {
  if (process.platform !== "linux") {
    throw new Error("Production upload provisioning verification must run on the future Linux production host.");
  }
  const configuredPath = process.env.NUAAFA_UPLOAD_DIR;
  if (!configuredPath) throw new Error("NUAAFA_UPLOAD_DIR is required.");
  const minimumFreeBytes = Number(process.env.NUAAFA_UPLOAD_MIN_FREE_BYTES ?? 1024 * 1024 * 1024);
  const result = await verifyUploadProvisioning({
    configuredPath,
    expectedPath: "/srv/nuaafa/shared/uploads",
    expectedOwner: "nuaafa",
    expectedGroup: "nuaafa",
    expectedMode: "0700",
    minimumFreeBytes,
  });
  if (!result.ownership.enforced) throw new Error("Linux ownership/mode checks were not enforced.");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Upload provisioning preflight failed.");
  process.exitCode = 3;
});
