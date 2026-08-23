import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { createClient, type Client } from "@libsql/client";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function migrationEntries() {
  return (await readdir(path.resolve("prisma/migrations"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function apply(client: Client, name: string) {
  const sql = await readFile(path.resolve("prisma/migrations", name, "migration.sql"), "utf8");
  await client.executeMultiple(sql);
  return sql;
}

async function count(client: Client, table: string) {
  const result = await client.execute(`SELECT COUNT(*) AS count FROM "${table}"`);
  return Number(result.rows[0]?.count ?? 0);
}

async function main() {
  const databasePath = process.env.UNIFIED_ADMIN_MIGRATION_DATABASE_PATH;
  if (!databasePath) throw new Error("An isolated migration database path is required.");
  const client = createClient({ url: `file:${databasePath.replaceAll("\\", "/")}` });
  try {
    const entries = await migrationEntries();
    const foundation = entries.find((entry) => entry.endsWith("_unified_admin_r1_foundation"));
    assert(foundation, "The formal foundation migration is missing.");
    const legacyEntries = entries.filter((entry) => entry < foundation);
    assert(legacyEntries.length === 6, `Expected six approved legacy migrations, received ${legacyEntries.length}.`);
    for (const entry of legacyEntries) await apply(client, entry);

    await client.executeMultiple(`
      INSERT INTO "Competition" ("id","slug","name","year","campus","format","status","isTestData","source","createdAt","updatedAt")
      VALUES ('migration-competition','migration-competition','迁移验收赛事',2026,'天目湖','ELEVEN_A_SIDE','ACTIVE',0,'MANUAL',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
      INSERT INTO "Team" ("id","competitionId","name","teamType","source") VALUES
        ('migration-home','migration-competition','迁移主队','FREEFORM','MANUAL'),
        ('migration-away','migration-competition','迁移客队','FREEFORM','MANUAL');
      INSERT INTO "Match" ("id","slug","competitionId","stage","kickoff","venue","source","homeTeamId","awayTeamId","status","applicationWindowStatus","isTestData","createdAt","updatedAt")
      VALUES ('migration-match','migration-match','migration-competition','小组赛','2026-09-01T10:00:00.000Z','迁移球场','MANUAL','migration-home','migration-away','SCHEDULED','CLOSED',0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
      INSERT INTO "Referee" ("id","publicCode","name","status","elevenASide","futsal","mustChangePassword","trainingStatus","publicDirectoryEnabled","failedLoginCount","createdAt","updatedAt")
      VALUES ('migration-referee','MIGRATION-001','迁移裁判','ACTIVE',1,0,1,'NOT_STARTED',0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
      INSERT INTO "AdminAccount" ("id","username","displayName","passwordHash","role","isActive","mustChangePassword","createdAt","updatedAt") VALUES
        ('migration-super','migration-super','迁移超级管理员','test-only-hash','SUPER_ADMIN',1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
        ('migration-referee-admin','migration-referee-admin','迁移裁判管理员','test-only-hash','REFEREE_MANAGER',1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
      INSERT INTO "AdminSession" ("id","tokenHash","expiresAt","createdAt","lastSeenAt","adminAccountId")
      VALUES ('migration-session','migration-token','2030-01-01T00:00:00.000Z',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'migration-referee-admin');
      INSERT INTO "RefereeAppointment" ("id","matchId","status","revision","createdAt","updatedAt")
      VALUES ('migration-appointment','migration-match','PUBLISHED',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
      INSERT INTO "AppointmentVersion" ("id","appointmentId","revision","status","snapshot","createdByAdminId","createdAt")
      VALUES ('migration-version','migration-appointment',1,'PUBLISHED','{"version":1}','migration-referee-admin',CURRENT_TIMESTAMP);
      INSERT INTO "AuditLog" ("id","actorType","actorId","action","entityType","entityId","summary","metadata","createdAt")
      VALUES ('migration-existing-audit','ADMIN','migration-referee-admin','MIGRATION_BASELINE','RefereeAppointment','migration-appointment','迁移前审计记录','{}',CURRENT_TIMESTAMP);
    `);

    const protectedTables = ["Competition", "Team", "Match", "Referee", "RefereeAppointment", "AppointmentVersion", "AdminAccount", "AdminSession"];
    const before = Object.fromEntries(await Promise.all(protectedTables.map(async (table) => [table, await count(client, table)])));
    const auditBefore = await count(client, "AuditLog");
    const foundationSql = await apply(client, foundation);
    const after = Object.fromEntries(await Promise.all(protectedTables.map(async (table) => [table, await count(client, table)])));
    for (const table of protectedTables) assert(after[table] === before[table], `${table} row count changed during additive migration.`);

    const roles = await client.execute('SELECT "adminAccountId", "role" FROM "AdminRoleAssignment" ORDER BY "adminAccountId"');
    assert(roles.rows.length === 2, "Legacy role backfill count is incorrect.");
    assert(roles.rows.some((row) => row.adminAccountId === "migration-super" && row.role === "SUPER_ADMIN"), "SUPER_ADMIN backfill failed.");
    assert(roles.rows.some((row) => row.adminAccountId === "migration-referee-admin" && row.role === "REFEREE_ADMIN"), "REFEREE_MANAGER compatibility backfill failed.");
    assert(await count(client, "AuditLog") === auditBefore + 2, "Backfill audit entries were not added exactly once.");

    const backfillMarker = "-- Backfill the legacy single-role model";
    const backfillSql = foundationSql.slice(foundationSql.indexOf(backfillMarker));
    assert(backfillSql.startsWith(backfillMarker), "Could not isolate the idempotent backfill SQL.");
    await client.executeMultiple(backfillSql);
    await client.executeMultiple(backfillSql);
    assert(await count(client, "AdminRoleAssignment") === 2, "Role backfill is not idempotent.");
    assert(await count(client, "AuditLog") === auditBefore + 2, "Audit backfill is not idempotent.");

    const integrity = await client.execute("PRAGMA integrity_check");
    assert(integrity.rows.length === 1 && integrity.rows[0]?.integrity_check === "ok", "SQLite integrity_check failed.");
    const foreignKeys = await client.execute("PRAGMA foreign_key_check");
    assert(foreignKeys.rows.length === 0, "SQLite foreign_key_check found violations.");
    const schemaObjects = await client.execute(`
      SELECT "type", "name" FROM sqlite_master
      WHERE "name" IN ('AdminRoleAssignment','MediaAsset','ContentPost','DisciplineDetail','ContentPost_slug_key','MediaAsset_storageKey_key')
      ORDER BY "type", "name"
    `);
    assert(schemaObjects.rows.length === 6, "Expected foundation tables or key indexes are missing.");
    assert(await count(client, "AdminSession") === 1, "Existing AdminSession was not preserved.");

    console.log(JSON.stringify({
      legacyMigrations: legacyEntries,
      appliedMigration: foundation,
      protectedRowCountsPreserved: after,
      roleBackfill: roles.rows,
      idempotentBackfill: true,
      adminSessionPreserved: true,
      integrityCheck: "ok",
      foreignKeyViolations: 0,
      schemaObjectCount: schemaObjects.rows.length,
    }, null, 2));
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
