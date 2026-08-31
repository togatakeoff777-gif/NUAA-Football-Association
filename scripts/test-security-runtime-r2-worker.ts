import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

import { PrismaClient } from "../src/generated/prisma-v29/client";

type PasswordVerifier = (password: string, storedHash: string) => Promise<boolean>;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function applyMigrations(url: string) {
  const client = createClient({ url });
  try {
    const entries = (await readdir(path.resolve("prisma/migrations"), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      await client.executeMultiple(await readFile(path.resolve("prisma/migrations", entry.name, "migration.sql"), "utf8"));
    }
  } finally {
    client.close();
  }
}

async function main() {
  const databasePath = process.env.SECURITY_R2_TEST_DATABASE_PATH;
  if (!databasePath) throw new Error("SECURITY_R2_TEST_DATABASE_PATH is required.");
  const url = `file:${databasePath.replaceAll("\\", "/")}`;
  process.env.DATABASE_URL = url;

  await applyMigrations(url);
  const security = await import("../src/lib/referee-security");
  const credentials = await import("../src/lib/referee-credentials");
  const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url }) });
  const fixturePassword = "Security-R2-Fixture-Password-2026!";
  const wrongPassword = "Security-R2-Wrong-Password-2026!";
  const realHash = await security.hashPassword(fixturePassword);

  try {
    assert(security.isUsablePasswordHash(security.DUMMY_PASSWORD_HASH), "Dummy hash is not a valid production-format scrypt hash.");
    assert(Buffer.from(security.DUMMY_PASSWORD_HASH.split("$")[1], "base64url").byteLength === 16, "Dummy hash salt length differs from production.");
    assert(Buffer.from(security.DUMMY_PASSWORD_HASH.split("$")[2], "base64url").byteLength === 64, "Dummy hash key length differs from production.");
    assert(await security.verifyPassword(wrongPassword, security.DUMMY_PASSWORD_HASH) === false, "Dummy hash unexpectedly authenticated the fixture password.");

    await prisma.adminAccount.createMany({ data: [
      { username: "r2-admin-active", displayName: "R2 Active", passwordHash: realHash, role: "SUPER_ADMIN", isActive: true },
      { username: "r2-admin-inactive", displayName: "R2 Inactive", passwordHash: realHash, role: "SUPER_ADMIN", isActive: false },
      { username: "r2-admin-invalid", displayName: "R2 Invalid", passwordHash: "invalid-r2-hash", role: "SUPER_ADMIN", isActive: true },
    ] });
    await prisma.referee.createMany({ data: [
      { publicCode: "R2-REF-ACTIVE", name: "R2 Active", passwordHash: realHash, status: "ACTIVE" },
      { publicCode: "R2-REF-INACTIVE", name: "R2 Inactive", passwordHash: realHash, status: "INACTIVE" },
      { publicCode: "R2-REF-NO-HASH", name: "R2 No Hash", passwordHash: null, status: "ACTIVE" },
    ] });

    async function expectSingleVerification(
      label: string,
      expectedHash: string,
      action: (verifier: PasswordVerifier) => Promise<unknown>,
    ) {
      const calls: Array<{ password: string; hash: string }> = [];
      const result = await action(async (password, hash) => {
        calls.push({ password, hash });
        return false;
      });
      assert(result === null || result === false, `${label} unexpectedly authenticated.`);
      assert(calls.length === 1, `${label} executed ${calls.length} KDF verifications; expected exactly one.`);
      assert(calls[0].password === wrongPassword, `${label} changed the submitted password.`);
      assert(calls[0].hash === expectedHash, `${label} used the wrong KDF hash class.`);
      console.log(`PASS ${label}: exactly one equivalent KDF verification`);
    }

    await expectSingleVerification("admin nonexistent", security.DUMMY_PASSWORD_HASH, (verifier) => credentials.authenticateAdminCredentials("r2-admin-missing", wrongPassword, verifier));
    await expectSingleVerification("admin active wrong password", realHash, (verifier) => credentials.authenticateAdminCredentials("r2-admin-active", wrongPassword, verifier));
    await expectSingleVerification("admin inactive", security.DUMMY_PASSWORD_HASH, (verifier) => credentials.authenticateAdminCredentials("r2-admin-inactive", wrongPassword, verifier));
    await expectSingleVerification("admin unusable hash", security.DUMMY_PASSWORD_HASH, (verifier) => credentials.authenticateAdminCredentials("r2-admin-invalid", wrongPassword, verifier));
    await expectSingleVerification("referee nonexistent", security.DUMMY_PASSWORD_HASH, (verifier) => credentials.authenticateRefereeCredentials("R2-REF-MISSING", wrongPassword, verifier));
    await expectSingleVerification("referee active wrong password", realHash, (verifier) => credentials.authenticateRefereeCredentials("R2-REF-ACTIVE", wrongPassword, verifier));
    await expectSingleVerification("referee inactive", security.DUMMY_PASSWORD_HASH, (verifier) => credentials.authenticateRefereeCredentials("R2-REF-INACTIVE", wrongPassword, verifier));
    await expectSingleVerification("referee missing hash", security.DUMMY_PASSWORD_HASH, (verifier) => credentials.authenticateRefereeCredentials("R2-REF-NO-HASH", wrongPassword, verifier));

    assert(await credentials.authenticateAdminCredentials("r2-admin-active", fixturePassword), "Valid admin credentials regressed.");
    assert(await credentials.authenticateRefereeCredentials("R2-REF-ACTIVE", fixturePassword), "Valid referee credentials regressed.");
    console.log("F-005 deterministic KDF invocation and valid-login regressions passed.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
