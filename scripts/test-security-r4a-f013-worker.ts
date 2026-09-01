import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma-v29/client";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function rejects(action: () => unknown | Promise<unknown>) {
  try {
    await action();
  } catch {
    return;
  }
  throw new Error("Expected operation to reject.");
}

async function applyMigrations(url: string) {
  const client = createClient({ url });
  const entries = (await readdir(path.resolve("prisma/migrations"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    await client.executeMultiple(
      await readFile(path.resolve("prisma/migrations", entry.name, "migration.sql"), "utf8"),
    );
  }
  client.close();
}

async function main() {
  const databasePath = process.env.SECURITY_R4A_F013_DATABASE_PATH;
  if (!databasePath) throw new Error("SECURITY_R4A_F013_DATABASE_PATH is required.");
  const url = `file:${databasePath.replaceAll("\\", "/")}`;
  process.env.DATABASE_URL = url;
  process.env.NUAAFA_ISOLATED_SECURITY_TEST = "1";
  await applyMigrations(url);

  const verifier = new PrismaClient({ adapter: new PrismaLibSql({ url }) });
  const service = await import("../src/lib/referee-service");
  const security = await import("../src/lib/referee-security");
  const capabilities = await import("./security-r4a-test-capabilities");

  const createReferee = async (id: string, publicCode: string, password: string) =>
    verifier.referee.create({
      data: {
        id,
        publicCode,
        name: `${publicCode} atomicity target`,
        passwordHash: await security.hashPassword(password),
        mustChangePassword: true,
        status: "ACTIVE",
        assignmentEligibility: "NOT_ELIGIBLE",
        elevenASide: false,
        futsal: false,
        trainingStatus: "PENDING_ASSESSMENT",
        publicDirectoryEnabled: false,
      },
    });
  const addSessions = async (refereeId: string, prefix: string) => {
    await verifier.refereeSession.createMany({
      data: [1, 2].map((index) => ({
        refereeId,
        tokenHash: `${prefix}-${index}`,
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      })),
    });
  };
  const createAuditFailureTrigger = async (name: string, action: string, entityId: string) => {
    await verifier.$executeRawUnsafe(`
      CREATE TRIGGER "${name}"
      BEFORE INSERT ON "AuditLog"
      WHEN NEW."action" = '${action}' AND NEW."entityId" = '${entityId}'
      BEGIN
        SELECT RAISE(ABORT, 'R4A forced AuditLog failure');
      END
    `);
  };

  try {
    const admin = await verifier.adminAccount.create({
      data: {
        username: "r4a-f013-admin",
        displayName: "R4A F-013 administrator",
        passwordHash: "isolated-test-only",
        role: "SUPER_ADMIN",
      },
    });
    const resetAuthorization = capabilities.issueTestAdminServiceAuthorization(
      "referees:write",
      capabilities.testUnifiedAdminActor({ id: admin.id }),
    );

    const resetOldPassword = "R4A-Reset-Old-Password-2026!";
    const resetNewPassword = "R4A-Reset-New-Password-2026!";
    const resetTarget = await createReferee("r4a-reset-target", "R4A-RESET", resetOldPassword);
    await addSessions(resetTarget.id, "reset-session");
    await createAuditFailureTrigger(
      "r4a_fail_reset_audit",
      "REFEREE_PASSWORD_RESET",
      resetTarget.id,
    );

    await rejects(() => service.resetRefereePassword(
      resetTarget.id,
      resetNewPassword,
      resetAuthorization,
    ));
    const resetAfterFailure = await verifier.referee.findUniqueOrThrow({ where: { id: resetTarget.id } });
    assert(
      resetAfterFailure.passwordHash !== null &&
      await security.verifyPassword(resetOldPassword, resetAfterFailure.passwordHash) &&
      !await security.verifyPassword(resetNewPassword, resetAfterFailure.passwordHash),
      "Audit failure did not roll back referee password reset.",
    );
    assert(
      await verifier.refereeSession.count({ where: { refereeId: resetTarget.id } }) === 2,
      "Audit failure did not roll back referee reset session deletion.",
    );
    assert(
      await verifier.auditLog.count({
        where: { action: "REFEREE_PASSWORD_RESET", entityId: resetTarget.id },
      }) === 0,
      "Failed reset committed a success audit row.",
    );

    await verifier.$executeRawUnsafe('DROP TRIGGER "r4a_fail_reset_audit"');
    await service.resetRefereePassword(resetTarget.id, resetNewPassword, resetAuthorization);
    const resetAfterRetry = await verifier.referee.findUniqueOrThrow({ where: { id: resetTarget.id } });
    assert(
      resetAfterRetry.passwordHash !== null &&
      await security.verifyPassword(resetNewPassword, resetAfterRetry.passwordHash) &&
      resetAfterRetry.mustChangePassword,
      "Successful reset did not commit the credential state.",
    );
    assert(
      await verifier.refereeSession.count({ where: { refereeId: resetTarget.id } }) === 0 &&
      await verifier.auditLog.count({
        where: { action: "REFEREE_PASSWORD_RESET", entityId: resetTarget.id },
      }) === 1,
      "Reset retry did not commit sessions and exactly one audit row.",
    );
    const resetAudit = await verifier.auditLog.findFirstOrThrow({
      where: { action: "REFEREE_PASSWORD_RESET", entityId: resetTarget.id },
    });
    assert(
      resetAudit.actorId === admin.id &&
      !JSON.stringify(resetAudit).includes(resetNewPassword),
      "Reset audit lost actor attribution or exposed password material.",
    );

    const resetAuditCount = await verifier.auditLog.count({
      where: { action: "REFEREE_PASSWORD_RESET" },
    });
    await rejects(() => service.resetRefereePassword(
      "missing-referee",
      "R4A-Missing-Password-2026!",
      resetAuthorization,
    ));
    await rejects(() => service.resetRefereePassword(
      resetTarget.id,
      "R4A-Forged-Password-2026!",
      { permission: "referees:write" } as never,
    ));
    assert(
      await verifier.auditLog.count({ where: { action: "REFEREE_PASSWORD_RESET" } }) === resetAuditCount,
      "Business or authorization failure created a reset success audit.",
    );

    const changeOldPassword = "R4A-Change-Old-Password-2026!";
    const changeNewPassword = "R4A-Change-New-Password-2026!";
    const changeTarget = await createReferee("r4a-change-target", "R4A-CHANGE", changeOldPassword);
    await addSessions(changeTarget.id, "change-session");
    const selfAuthorization = capabilities.issueTestRefereeSelfServiceAuthorization(changeTarget.id);
    await createAuditFailureTrigger(
      "r4a_fail_change_audit",
      "PASSWORD_CHANGED",
      changeTarget.id,
    );

    await rejects(() => service.changeRefereePassword(
      changeTarget.id,
      changeOldPassword,
      changeNewPassword,
      selfAuthorization,
    ));
    const changeAfterFailure = await verifier.referee.findUniqueOrThrow({ where: { id: changeTarget.id } });
    assert(
      changeAfterFailure.passwordHash !== null &&
      await security.verifyPassword(changeOldPassword, changeAfterFailure.passwordHash) &&
      !await security.verifyPassword(changeNewPassword, changeAfterFailure.passwordHash),
      "Audit failure did not roll back referee self password change.",
    );
    assert(
      await verifier.refereeSession.count({ where: { refereeId: changeTarget.id } }) === 2 &&
      await verifier.auditLog.count({
        where: { action: "PASSWORD_CHANGED", entityId: changeTarget.id },
      }) === 0,
      "Failed self password change committed sessions or success audit.",
    );

    await verifier.$executeRawUnsafe('DROP TRIGGER "r4a_fail_change_audit"');
    await service.changeRefereePassword(
      changeTarget.id,
      changeOldPassword,
      changeNewPassword,
      selfAuthorization,
    );
    const changeAfterRetry = await verifier.referee.findUniqueOrThrow({ where: { id: changeTarget.id } });
    assert(
      changeAfterRetry.passwordHash !== null &&
      await security.verifyPassword(changeNewPassword, changeAfterRetry.passwordHash) &&
      !changeAfterRetry.mustChangePassword &&
      await verifier.refereeSession.count({ where: { refereeId: changeTarget.id } }) === 0 &&
      await verifier.auditLog.count({
        where: { action: "PASSWORD_CHANGED", entityId: changeTarget.id },
      }) === 1,
      "Self password change retry did not commit business state and exactly one audit.",
    );
    const changeAudit = await verifier.auditLog.findFirstOrThrow({
      where: { action: "PASSWORD_CHANGED", entityId: changeTarget.id },
    });
    assert(
      changeAudit.actorType === "REFEREE" &&
      changeAudit.actorId === changeTarget.id &&
      !JSON.stringify(changeAudit).includes(changeNewPassword),
      "Self password audit lost attribution or exposed password material.",
    );

    const changeAuditCount = await verifier.auditLog.count({
      where: { action: "PASSWORD_CHANGED", entityId: changeTarget.id },
    });
    await rejects(() => service.changeRefereePassword(
      changeTarget.id,
      "wrong-current-password",
      "R4A-Another-New-Password-2026!",
      selfAuthorization,
    ));
    assert(
      await verifier.auditLog.count({
        where: { action: "PASSWORD_CHANGED", entityId: changeTarget.id },
      }) === changeAuditCount,
      "Business failure created a self-password success audit.",
    );

    console.log("R4A_F013_RESET_AUDIT_ROLLBACK=PASS");
    console.log("R4A_F013_RESET_SUCCESS_EXACTLY_ONCE=PASS");
    console.log("R4A_F013_CHANGE_AUDIT_ROLLBACK=PASS");
    console.log("R4A_F013_CHANGE_SUCCESS_EXACTLY_ONCE=PASS");
    console.log("R4A_F013_BUSINESS_FAILURE_NO_SUCCESS_AUDIT=PASS");
    console.log("R4A_F013_AUTH_FAILURE_NO_MUTATION_OR_AUDIT=PASS");
    console.log("R4A_F013_AUDIT_CONTENT=PASS");
    console.log("R4A_F013_RETRY_NO_DUPLICATE=PASS");
  } finally {
    await verifier.$executeRawUnsafe('DROP TRIGGER IF EXISTS "r4a_fail_reset_audit"').catch(() => undefined);
    await verifier.$executeRawUnsafe('DROP TRIGGER IF EXISTS "r4a_fail_change_audit"').catch(() => undefined);
    await verifier.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
